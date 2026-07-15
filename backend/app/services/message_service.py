
from uuid import UUID
from pathlib import Path
import mimetypes

from fastapi import UploadFile, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.message import Message
from app.repository.message_repository import MessageRepository
from app.exceptions.message import MessageNotFoundException
from app.schemas.message import AttachmentResponse, MessageResponse
from app.services.s3_service import S3Service
from app.api.deps import get_db


ALLOWED_ATTACHMENT_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/msword": "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
    "application/vnd.ms-excel": "document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
    "application/vnd.ms-powerpoint": "document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
    "text/plain": "document",
    "text/csv": "document",
}

ALLOWED_ATTACHMENT_PREFIXES = {
    "image/": "image",
    "video/": "video",
    "audio/": "audio",
}


class MessageService:
    def __init__(self, db: Session, s3_service: S3Service):
        self.repository = MessageRepository(db)
        self.s3_service = s3_service

    def send_message(self, sender_id: UUID, receiver_id: UUID, content: str):
        content = content.strip()
        if not content:
            raise ValueError("Message content cannot be empty.")

        return self.repository.create_message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content
        )

    def send_group_message(self, sender_id: UUID, group_id: UUID, content: str):
        content = content.strip()
        if not content:
            raise ValueError("Message content cannot be empty.")

        return self.repository.create_group_message(
            sender_id=sender_id,
            group_id=group_id,
            content=content
        )

    async def send_attachment_message(
        self,
        *,
        sender_id: UUID,
        receiver_id: UUID | None,
        group_id: UUID | None,
        content: str,
        file: UploadFile,
    ):
        if bool(receiver_id) == bool(group_id):
            raise ValueError("Provide either receiver_id or group_id.")

        file_content = await file.read()
        attachment = self._build_attachment_metadata(
            sender_id=sender_id,
            receiver_id=receiver_id,
            group_id=group_id,
            file=file,
            file_content=file_content,
        )

        object_key = attachment["attachment_s3_key"]
        try:
            if group_id:
                return self.repository.create_group_message(
                    sender_id=sender_id,
                    group_id=group_id,
                    content=content.strip(),
                    attachment=attachment,
                )

            return self.repository.create_message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content.strip(),
                attachment=attachment,
            )
        except Exception:
            self.s3_service.delete_file(object_key)
            raise

    def _build_attachment_metadata(
        self,
        *,
        sender_id: UUID,
        receiver_id: UUID | None,
        group_id: UUID | None,
        file: UploadFile,
        file_content: bytes,
    ) -> dict:
        file_name = Path(file.filename or "").name
        if not file_name:
            raise ValueError("Attachment file name is required.")

        if not file_content:
            raise ValueError("Attachment file cannot be empty.")

        max_size = self._max_attachment_size_bytes()
        if len(file_content) > max_size:
            raise ValueError(
                f"Attachment exceeds the {self._max_attachment_size_mb()} MB size limit."
            )

        guessed_content_type = mimetypes.guess_type(file_name)[0]
        content_type = file.content_type or guessed_content_type or ""
        if content_type == "application/octet-stream" and guessed_content_type:
            content_type = guessed_content_type
        category = self._attachment_category(content_type)
        if not category:
            raise ValueError("Attachment file type is not supported.")

        object_key = self.s3_service.build_object_key(
            sender_id=sender_id,
            receiver_id=receiver_id,
            group_id=group_id,
            extension=Path(file_name).suffix,
        )
        self.s3_service.upload_file(
            file_content=file_content,
            object_key=object_key,
            content_type=content_type,
            file_name=file_name,
        )

        return {
            "attachment_file_name": file_name,
            "attachment_content_type": content_type,
            "attachment_file_size": len(file_content),
            "attachment_s3_key": object_key,
            "attachment_category": category,
        }

    def _attachment_category(self, content_type: str) -> str | None:
        for prefix, category in ALLOWED_ATTACHMENT_PREFIXES.items():
            if content_type.startswith(prefix):
                return category

        return ALLOWED_ATTACHMENT_CONTENT_TYPES.get(content_type)

    def _max_attachment_size_mb(self) -> int:
        return max(1, settings.CHAT_ATTACHMENT_MAX_SIZE_MB)

    def _max_attachment_size_bytes(self) -> int:
        return self._max_attachment_size_mb() * 1024 * 1024

    def get_group_history(self, group_id: UUID) -> list[Message]:
        return self.repository.get_group_messages(group_id)

    def get_chat_history(self, user_id: UUID, other_user_id: UUID) -> list[Message]:
        return self.repository.get_conversation(
            user_id=user_id,
            other_user_id=other_user_id
        )

    def mark_messages_as_read(self, sender_id: UUID, receiver_id: UUID):
        return self.repository.mark_as_read(
            sender_id=sender_id,
            receiver_id=receiver_id
        )

    def get_recent_conversations(self, user_id: UUID) -> list[Message]:
        return self.repository.get_recent_conversations(user_id=user_id)

    def get_message(self, message_id: UUID) -> Message:
        message = self.repository.get_message_by_id(message_id)

        if not message:
            raise MessageNotFoundException("Message not found.")

        return message

    def edit_message(self, message_id: UUID, content: str) -> Message:
        content = content.strip()
        if not content:
            raise ValueError("Message content cannot be empty.")

        message = self.get_message(message_id)
        return self.repository.update_message(
            message=message,
            content=content
        )

    def delete_message(self, message_id: UUID):
        message = self.get_message(message_id)
        if message.attachment_s3_key:
            self.s3_service.delete_file(message.attachment_s3_key)
        self.repository.delete_message(message)

    def get_attachment_url(self, message_id: UUID, user_id: UUID) -> str:
        message = self.get_message(message_id)
        if not self.can_access_message(message, user_id):
            raise PermissionError("You do not have access to this attachment.")
        if not message.attachment_s3_key:
            raise MessageNotFoundException("Attachment not found.")

        url = self.s3_service.generate_download_url(message.attachment_s3_key)
        if not url:
            raise ValueError("Unable to generate attachment URL.")

        return url

    def can_access_message(self, message: Message, user_id: UUID) -> bool:
        return message.sender_id == user_id or message.receiver_id == user_id

    def build_message_response(self, message: Message) -> MessageResponse:
        return MessageResponse(
            id=message.id,
            sender_id=message.sender_id,
            receiver_id=message.receiver_id,
            group_id=message.group_id,
            content=message.content,
            attachment=self._attachment_response(message),
            is_read=message.is_read,
            created_at=message.created_at,
            updated_at=message.updated_at,
        )

    def serialize_message(self, message: Message, client_id: str | None = None) -> dict:
        response = self.build_message_response(message).model_dump(mode="json")
        payload = {
            **response,
            "text": message.content,
        }
        if client_id:
            payload["client_id"] = client_id
        return payload

    def _attachment_response(self, message: Message) -> AttachmentResponse | None:
        if not message.attachment_s3_key:
            return None

        return AttachmentResponse(
            file_name=message.attachment_file_name,
            content_type=message.attachment_content_type,
            file_size=message.attachment_file_size,
            category=message.attachment_category,
            s3_key=message.attachment_s3_key,
            url=self.s3_service.generate_download_url(message.attachment_s3_key),
        )


def get_s3_service() -> S3Service:
    return S3Service()


def get_message_service(
    db: Session = Depends(get_db),
    s3_service: S3Service = Depends(get_s3_service),
) -> MessageService:
    return MessageService(db=db, s3_service=s3_service)
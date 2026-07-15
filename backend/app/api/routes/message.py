from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps_auth import get_current_user
from app.exceptions.group import GroupNotFoundException
from app.exceptions.message import MessageNotFoundException
from app.models.user import User
from app.schemas.message import (
    ConversationResponse,
    MarkReadRequest,
    MessageResponse,
    MessageUpdate,
)
from app.services.group_serivce import GroupService
from app.services.message_service import MessageService, get_message_service
from app.services.s3_service import S3ConfigurationError, S3UploadError
from app.websocket.manager import manager

router = APIRouter(prefix="/messages", tags=["messages"])


def _ensure_sender(message, user_id: UUID):
    if message.sender_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the sender can modify this message.",
        )


@router.get("/history/{other_user_id}", response_model=list[MessageResponse])
def get_chat_history(
    other_user_id: UUID,
    current_user: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
):
    messages = service.get_chat_history(
        user_id=current_user.id,
        other_user_id=other_user_id,
    )
    return [service.build_message_response(message) for message in messages]


@router.get("/conversations/{user_id}", response_model=list[ConversationResponse])
def get_recent_conversations(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
):
    conversations = []

    for message in service.get_recent_conversations(user_id=current_user.id):
        other_user_id = (
            message.receiver_id
            if message.sender_id == current_user.id
            else message.sender_id
        )
        conversations.append(
            ConversationResponse(
                user_id=other_user_id,
                last_message=service.build_message_response(message),
            )
        )

    return conversations


@router.post(
    "/attachments",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_attachment_message(
    file: UploadFile = File(...),
    receiver_id: UUID | None = Form(default=None),
    group_id: UUID | None = Form(default=None),
    content: str = Form(default=""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    message_service: MessageService = Depends(get_message_service),
):
    group_service = GroupService(db)

    try:
        member_ids = None
        if group_id:
            group_service.ensure_member(group_id, current_user.id)
            member_ids = [
                str(member.user_id)
                for member in group_service.get_group_members(group_id)
            ]

        message = await message_service.send_attachment_message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            group_id=group_id,
            content=content,
            file=file,
        )
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except S3ConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except S3UploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    payload = message_service.serialize_message(message)
    if group_id:
        payload["type"] = "group_message"
        await manager.broadcast_to_users(member_ids or [], payload)
    else:
        payload["type"] = "private_message"
        await manager.send_personal_message(str(receiver_id), payload)
        await manager.send_personal_message(str(current_user.id), payload)

    return message_service.build_message_response(message)


@router.get("/{message_id}/attachment-url")
def get_attachment_url(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    message_service: MessageService = Depends(get_message_service),
):
    group_service = GroupService(db)

    try:
        message = message_service.get_message(message_id)
        if message.group_id:
            group_service.ensure_member(message.group_id, current_user.id)
        elif not message_service.can_access_message(message, current_user.id):
            raise PermissionError("You do not have access to this attachment.")

        if not message.attachment_s3_key:
            raise MessageNotFoundException("Attachment not found.")

        url = message_service.s3_service.generate_download_url(message.attachment_s3_key)
        if not url:
            raise ValueError("Unable to generate attachment URL.")

        return {"url": url}
    except MessageNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.patch("/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_messages_as_read(
    payload: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
):
    service.mark_messages_as_read(
        sender_id=payload.other_user_id,
        receiver_id=current_user.id,
    )


@router.patch("/{message_id}", response_model=MessageResponse)
def edit_message(
    message_id: UUID,
    payload: MessageUpdate,
    current_user: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
):
    try:
        message = service.get_message(message_id)
        _ensure_sender(message, current_user.id)
        return service.edit_message(
            message_id=message_id,
            content=payload.content,
        )
    except MessageNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
):
    try:
        message = service.get_message(message_id)
        _ensure_sender(message, current_user.id)
        service.delete_message(message_id)
    except MessageNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
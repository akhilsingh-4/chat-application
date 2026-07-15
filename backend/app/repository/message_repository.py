from uuid import UUID

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.message import Message

class MessageRepository:

    def __init__(self, db: Session):
        self.db = db

    def create_message(
        self,
        sender_id: UUID,
        receiver_id: UUID,
        content: str,
        attachment: dict | None = None,
    ):

        message = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            **(attachment or {}),
        )

        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def create_group_message(
        self,
        sender_id: UUID,
        group_id: UUID,
        content: str,
        attachment: dict | None = None,
    ):
        message = Message(
            sender_id=sender_id,
            group_id=group_id,
            content=content,
            **(attachment or {}),
        )

        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_conversation(self, user_id: UUID, other_user_id: UUID)->list[Message]:
        return(
            self.db.query(Message)
            .filter(
                Message.group_id.is_(None),
                or_(
                    and_(
                        Message.sender_id == user_id,
                        Message.receiver_id == other_user_id,
                    ),
                    and_(
                        Message.sender_id == other_user_id,
                        Message.receiver_id == user_id
                    )
                )
            )
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )

    def get_recent_conversations(self, user_id: UUID)->list[Message]:
        messages = (
            self.db.query(Message)
            .filter(
                Message.group_id.is_(None),
                or_(
                    Message.sender_id == user_id,
                    Message.receiver_id == user_id,
                )
            )
            .order_by(Message.created_at.desc(), Message.id.desc())
            .all()
        )

        recent_messages = []
        seen_user_ids = set()
        for message in messages:
            other_user_id = (
                message.receiver_id
                if message.sender_id == user_id
                else message.sender_id
            )
            if other_user_id in seen_user_ids:
                continue

            recent_messages.append(message)
            seen_user_ids.add(other_user_id)

        return recent_messages
    
    def mark_as_read(self, sender_id: UUID, receiver_id: UUID):
        updated_count = (
            self.db.query(Message)
            .filter(
                Message.sender_id == sender_id,
                Message.receiver_id == receiver_id,
                Message.is_read == False
            )
            .update(
                {"is_read": True},
                synchronize_session=False
            )
        )
        self.db.commit()
        return updated_count

    def get_group_messages(self, group_id: UUID) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(Message.group_id == group_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )

    def get_message_by_id(self, message_id: UUID)->Message | None:
        return(
            self.db.query(Message)
            .filter(Message.id == message_id)
            .first()
        )
    
    def update_message(self, message: Message, content: str)-> Message:
        message.content = content
        self.db.commit()
        self.db.refresh(message)

        return message
    
    def delete_message(self, message: Message):

        self.db.delete(message)
        self.db.commit()

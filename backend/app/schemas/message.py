from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MessageBase(BaseModel):
    content: str


class AttachmentResponse(BaseModel):
    file_name: str
    content_type: str
    file_size: int
    category: str
    s3_key: str
    url: str | None = None


class MessageUpdate(MessageBase):
    user_id: UUID


class MarkReadRequest(BaseModel):
    user_id: UUID
    other_user_id: UUID


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sender_id: UUID
    receiver_id: UUID | None
    group_id: UUID | None = None
    content: str
    attachment: AttachmentResponse | None = None
    is_read: bool | None
    created_at: datetime | None
    updated_at: datetime | None


class ConversationResponse(BaseModel):
    user_id: UUID
    last_message: MessageResponse

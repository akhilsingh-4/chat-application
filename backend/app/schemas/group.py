from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GroupCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )
    description : str | None = None


class AddMemberRequest(BaseModel):
    user_id: UUID


class GroupMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    group_id: UUID
    user_id: UUID
    joined_at: datetime


class GroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class GroupDetailResponse(GroupResponse):
    members: list[GroupMemberResponse] = Field(default_factory=list)

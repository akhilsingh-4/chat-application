import uuid

from sqlalchemy import BigInteger, Column, Text, Boolean, DateTime, ForeignKey, CheckConstraint, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base

class Message(Base):
    __tablename__ = "messages"

    __table_args__ = (
        CheckConstraint(
            "(receiver_id IS NOT NULL AND group_id IS NULL) OR "
            "(receiver_id IS NULL AND group_id IS NOT NULL)",
            name="ck_messages_receiver_or_group",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    sender_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    receiver_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )

    content = Column(
        Text,
        nullable=False
    )

    attachment_file_name = Column(
        String(255),
        nullable=True
    )

    attachment_content_type = Column(
        String(255),
        nullable=True
    )

    attachment_file_size = Column(
        BigInteger,
        nullable=True
    )

    attachment_s3_key = Column(
        String(1024),
        nullable=True
    )

    attachment_category = Column(
        String(32),
        nullable=True
    )

    is_read = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    sender = relationship(
        "User",
        foreign_keys=[sender_id]
    )

    receiver = relationship(
        "User",
         foreign_keys=[receiver_id]
    )

    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id"),
        nullable=True
    )

    group = relationship("Group")

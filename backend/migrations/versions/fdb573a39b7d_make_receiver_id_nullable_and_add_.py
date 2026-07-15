"""make receiver_id nullable and add receiver_or_group check

Revision ID: fdb573a39b7d
Revises: 7b9f0d2c6a31
Create Date: 2026-06-30 16:11:00.909980

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'fdb573a39b7d'
down_revision: Union[str, Sequence[str], None] = '7b9f0d2c6a31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'messages',
        'receiver_id',
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.create_check_constraint(
        'ck_messages_receiver_or_group',
        'messages',
        '(receiver_id IS NOT NULL AND group_id IS NULL) OR (receiver_id IS NULL AND group_id IS NOT NULL)',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('ck_messages_receiver_or_group', 'messages', type_='check')
    op.alter_column(
        'messages',
        'receiver_id',
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
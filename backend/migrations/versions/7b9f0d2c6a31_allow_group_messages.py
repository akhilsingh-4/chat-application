"""allow group messages

Revision ID: 7b9f0d2c6a31
Revises: 25f173f0385d
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "7b9f0d2c6a31"
down_revision: Union[str, Sequence[str], None] = "25f173f0385d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "messages",
        "receiver_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.alter_column(
        "groups",
        "description",
        existing_type=sa.Text(),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "groups",
        "description",
        existing_type=sa.Text(),
        nullable=False,
    )
    op.alter_column(
        "messages",
        "receiver_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )

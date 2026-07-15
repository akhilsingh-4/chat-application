"""add message attachment metadata

Revision ID: 2f4e1bb0b923
Revises: fdb573a39b7d
Create Date: 2026-07-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2f4e1bb0b923"
down_revision: Union[str, Sequence[str], None] = "fdb573a39b7d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("messages", sa.Column("attachment_file_name", sa.String(length=255), nullable=True))
    op.add_column("messages", sa.Column("attachment_content_type", sa.String(length=255), nullable=True))
    op.add_column("messages", sa.Column("attachment_file_size", sa.BigInteger(), nullable=True))
    op.add_column("messages", sa.Column("attachment_s3_key", sa.String(length=1024), nullable=True))
    op.add_column("messages", sa.Column("attachment_category", sa.String(length=32), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("messages", "attachment_category")
    op.drop_column("messages", "attachment_s3_key")
    op.drop_column("messages", "attachment_file_size")
    op.drop_column("messages", "attachment_content_type")
    op.drop_column("messages", "attachment_file_name")

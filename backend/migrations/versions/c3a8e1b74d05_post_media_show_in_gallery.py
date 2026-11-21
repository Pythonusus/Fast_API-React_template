"""add post_media show_in_gallery

Revision ID: c3a8e1b74d05
Revises: b7f3a91c4e20
Create Date: 2026-11-20 09:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3a8e1b74d05"
down_revision: Union[str, Sequence[str], None] = "b7f3a91c4e20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "post_media",
        sa.Column(
            "show_in_gallery",
            sa.Boolean(),
            server_default="true",
            nullable=False,
            comment=(
                "When true, this attachment is listed in the public gallery. "
                "When false, it is only shown if the body HTML embeds it."
            ),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("post_media", "show_in_gallery")

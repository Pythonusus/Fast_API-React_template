"""add post show_gallery

Revision ID: b7f3a91c4e20
Revises: a41c7e2d9b10
Create Date: 2026-11-09 09:40:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7f3a91c4e20"
down_revision: Union[str, Sequence[str], None] = "a41c7e2d9b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "posts",
        sa.Column(
            "show_gallery",
            sa.Boolean(),
            server_default="true",
            nullable=False,
            comment=(
                "When true, gallery attachments are shown below the body on "
                "the post detail page. When false, media is only visible when "
                "embedded in the HTML body."
            ),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("posts", "show_gallery")

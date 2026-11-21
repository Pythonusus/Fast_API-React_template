"""add post is_draft

Revision ID: e7c2a4d81b90
Revises: c3a8e1b74d05
Create Date: 2026-11-21 18:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7c2a4d81b90"
down_revision: Union[str, Sequence[str], None] = "c3a8e1b74d05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "posts",
        sa.Column(
            "is_draft",
            sa.Boolean(),
            server_default="false",
            nullable=False,
            comment=(
                "Unpublished post. Visible in the admin panel only. The "
                "public API omits these rows. Only a new post can be a "
                "draft; saving a published post leaves this false."
            ),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("posts", "is_draft")

"""post media attachments and covers

Revision ID: a41c7e2d9b10
Revises: 6eb274acb015
Create Date: 2026-11-05 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a41c7e2d9b10'
down_revision: Union[str, Sequence[str], None] = '6eb274acb015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('post_media',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=True, comment='Owning post. NULL until the post form is saved.'),
    sa.Column('key', sa.String(length=512), nullable=False, comment='Object key in the S3 bucket.'),
    sa.Column('kind', sa.String(length=16), nullable=False, comment='image, video, or audio.'),
    sa.Column('content_type', sa.String(length=127), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False, comment='Original file name, for display only.'),
    sa.Column('size', sa.Integer(), nullable=False, comment='Size in bytes.'),
    sa.Column('position', sa.Integer(), server_default='0', nullable=False, comment='Order in the gallery.'),
    sa.Column('is_attachment', sa.Boolean(), nullable=False, comment='Part of the gallery. False for a cover uploaded separately, which does not count toward the attachment limit.'),
    sa.Column('is_cover', sa.Boolean(), nullable=False, comment='Post cover. At most one per post, enforced in code.'),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('key')
    )
    op.create_index(op.f('ix_post_media_post_id'), 'post_media', ['post_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_post_media_post_id'), table_name='post_media')
    op.drop_table('post_media')

"""
SQLAlchemy application models.

Define the structure of the database tables.
"""

from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.engine import Base
from app.settings import settings
from app.storage import public_object_url


@dataclass
class MediaSelection:
    """Gallery order plus cover, as chosen in the admin post form.

    ``cover`` is either one of ``attachments`` (an image picked from the
    gallery) or a separate upload that does not count toward the limit.
    """

    attachments: list["PostMedia"] = field(default_factory=list)
    cover: "PostMedia | None" = None


class Post(Base):
    """
    Blog post stored in the ``posts`` table.

    ``nullable=False`` only rejects SQL NULL — empty strings (``""``) are
    still allowed at the DB layer. Length / non-empty rules live in Pydantic
    (``app.schemas.posts``) for the API and in ``PostAdmin.validate`` for
    the admin panel (admin does not use those schemas by default). Content
    length is also capped by a check constraint (see ``__table_args__``).
    """

    __tablename__ = "posts"
    __table_args__ = (
        CheckConstraint(
            f"length(content) <= {settings.post_content_max_length}",
            name="ck_posts_content_length",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,  # Auto-applied by Postgres on insert.
        comment="Primary key.",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Human-readable headline shown in lists and detail views.",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment=(
            "Body in HTML format (e.g. <p>Hello</p>). "
            f"Max {settings.post_content_max_length} characters."
        ),
    )

    # Timezone-aware timestamps (Postgres TIMESTAMPTZ).
    # timezone=True means the column stores an absolute instant; Postgres
    # keeps the value in UTC. func.now() is that instant at write time.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),  # Set to the current UTC time in DB.
        nullable=False,
        comment="When the post was created (UTC / TIMESTAMPTZ).",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="When the post was last updated (UTC / TIMESTAMPTZ).",
    )

    # Gallery attachments and the cover, in gallery order.
    # selectin: async sessions cannot lazy-load on attribute access, so the
    # rows are fetched together with the posts.
    # delete-orphan: a row dropped from this list is deleted on flush.
    media: Mapped[list["PostMedia"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
        order_by="PostMedia.position",
    )

    @property
    def cover(self) -> "PostMedia | None":
        return next((m for m in self.media if m.is_cover), None)

    @property
    def gallery(self) -> list["PostMedia"]:
        """Attachments shown in the gallery. The cover is shown separately."""
        return [m for m in self.media if m.is_attachment and not m.is_cover]

    @property
    def media_selection(self) -> MediaSelection:
        return MediaSelection(
            attachments=[m for m in self.media if m.is_attachment],
            cover=self.cover,
        )

    @media_selection.setter
    def media_selection(self, selection: MediaSelection) -> None:
        keep: list[PostMedia] = []
        for position, item in enumerate(selection.attachments):
            item.position = position
            item.is_attachment = True
            item.is_cover = item is selection.cover
            keep.append(item)

        cover = selection.cover
        if cover is not None and all(cover is not m for m in keep):
            cover.position = 0
            cover.is_attachment = False
            cover.is_cover = True
            keep.append(cover)

        # Storage objects of dropped rows are deleted after the commit
        # (see PostAdmin.after_edit_committed). Plain attribute, not mapped.
        self.removed_media_keys = [
            m.key for m in self.media if all(m is not k for k in keep)
        ]
        self.media = keep


class PostMedia(Base):
    """
    Image, video, or audio file stored in S3 and attached to a post.

    A row is created when the file is uploaded, with ``post_id`` NULL.
    Saving the post form attaches it. Rows still unattached after a day
    are removed by the upload endpoint.
    """

    __tablename__ = "post_media"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    post_id: Mapped[int | None] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        index=True,
        comment="Owning post. NULL until the post form is saved.",
    )
    key: Mapped[str] = mapped_column(
        String(512),
        unique=True,
        comment="Object key in the S3 bucket.",
    )
    kind: Mapped[str] = mapped_column(
        String(16),
        comment="image, video, or audio.",
    )
    content_type: Mapped[str] = mapped_column(String(127))
    filename: Mapped[str] = mapped_column(
        String(255),
        comment="Original file name, for display only.",
    )
    size: Mapped[int] = mapped_column(Integer, comment="Size in bytes.")
    position: Mapped[int] = mapped_column(
        default=0,
        server_default="0",
        comment="Order in the gallery.",
    )
    is_attachment: Mapped[bool] = mapped_column(
        default=True,
        comment=(
            "Part of the gallery. False for a cover uploaded separately, "
            "which does not count toward the attachment limit."
        ),
    )
    is_cover: Mapped[bool] = mapped_column(
        default=False,
        comment="Post cover. At most one per post, enforced in code.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    post: Mapped[Post | None] = relationship(back_populates="media")

    @property
    def url(self) -> str:
        return public_object_url(self.key)

"""
SQLAlchemy application models.

Define the structure of the database tables.
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.engine import Base
from app.settings import settings


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

"""
SQLAlchemy application models.

Define the structure of the database tables.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, false, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.engine import Base


class Post(Base):
    """
    Blog post stored in the ``posts`` table.
    Validation is done by Pydantic schemas.
    """

    __tablename__ = "posts"

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
    slug: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        comment="URL-friendly unique identifier (e.g. getting-started).",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Body in HTML format (e.g. <p>Hello</p>).",
    )
    # False = draft (not shown publicly); True = published.
    published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        # Keeping both default and server_default is slightly an
        # overkill, but it's a good practice to have both.
        default=False,  # Set to False by default in ORM
        server_default=false(),  # Set to False by default in DB.
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

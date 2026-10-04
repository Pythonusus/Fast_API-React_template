"""
SQLAlchemy application models.

Define the structure of the database tables.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
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
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Body in HTML format (e.g. <p>Hello</p>).",
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

"""
Pydantic schemas for posts CRUD operations.
"""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
)

from app.settings import settings


class PostBase(BaseModel):
    """
    Shared post fields used by create/update/response schemas.
    """

    # ConfigDict holds Pydantic v2 model options.
    # These settings are applied to all fields in the model.
    #
    # str_strip_whitespace=True trims leading/trailing spaces on every str field
    # before validation (so "  Hi  " becomes "Hi" before min_length/max_length).
    #
    # See https://docs.pydantic.dev/latest/usage/model_config/
    model_config = ConfigDict(str_strip_whitespace=True)

    # Required fields are marked with `...`
    title: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Human-readable headline shown in lists and detail views.",
        examples=["Getting started with FastAPI"],
    )
    content: str = Field(
        ...,
        min_length=2,
        max_length=30_000,
        description="Body in HTML format (e.g. ``<p>Hello</p>``).",
        examples=["<p>Hello from <strong>TinyMCE</strong>.</p>"],
    )


class PostCreate(PostBase):
    """Request body for ``POST`` — create a new post."""


class PostUpdate(PostBase):
    """
    Request body for ``PATCH`` — partial update.

    Inherits ``model_config`` from ``PostBase``. Fields are redeclared as
    optional so omit means "leave unchanged"; constraints still apply when
    a value is sent.
    """

    # `str | None` alone still requires the key (send a string or null).
    # `default=None` lets the client omit the key ("leave unchanged").
    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
        description="Human-readable headline shown in lists and detail views.",
        examples=["Getting started with FastAPI"],
    )
    content: str | None = Field(
        default=None,
        min_length=2,
        max_length=30_000,
        description="Body in HTML format (e.g. ``<p>Hello</p>``).",
        examples=["<p>Hello from <strong>TinyMCE</strong>.</p>"],
    )


class PostRead(PostBase):
    """
    Post returned by the API (list item or detail).

    ``from_attributes=True`` lets Pydantic build this from an ORM model
    ``Post`` instance (``PostRead.model_validate(row)``).

    Datetimes are stored as UTC (``TIMESTAMPTZ``) and serialized in
    ``settings.timezone`` (env ``TIMEZONE``, default Europe/Moscow).
    Use this schema as ``response_model`` so FastAPI applies that conversion.
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        from_attributes=True,
    )

    id: int = Field(..., description="Primary key.", examples=[1])
    created_at: datetime = Field(
        ...,
        description="When the post was created (converted to app timezone).",
    )
    updated_at: datetime = Field(
        ...,
        description="When the post was last updated"
                    "(converted to app timezone).",
    )

    # field_serializer runs when Pydantic turns this model into JSON
    # (FastAPI response_model, model_dump(mode="json"), etc.).
    # It does NOT change the ORM row or the value stored in Postgres.
    #
    # Flow:
    # 1. ORM gives a UTC-aware datetime from TIMESTAMPTZ (or rarely a naive one)
    # 2. If tzinfo is missing, treat the value as UTC so astimezone() is defined
    # 3. astimezone(...) re-labels the same instant in settings.timezone
    #    (e.g. Europe/Moscow -> +03:00 in the JSON output).
    @field_serializer("created_at", "updated_at")
    def serialize_in_app_timezone(self, value: datetime) -> datetime:
        """Convert UTC (or naive-as-UTC) datetimes to ``settings.timezone``."""
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(ZoneInfo(settings.timezone))


# No delete model because in delete requests there is nothing to validate.

"""Schemas for stored-file endpoints."""

from pydantic import BaseModel


class FileUrl(BaseModel):
    """Presigned URL the browser can request directly."""

    url: str

"""Upload post attachments and covers from the admin post form."""

import asyncio
from datetime import UTC, datetime, timedelta
from pathlib import PurePath
from typing import Literal
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.auth import session_admin_username
from app.db.engine import get_session
from app.db.posts.models import PostMedia
from app.schemas.posts import MediaRead
from app.settings import settings
from app.storage import delete_objects, upload_fileobj

router = APIRouter(prefix="/api/admin", tags=["admin-media"])

# Uploads that were never saved with a post (form closed, file removed
# before saving) are deleted once they are this old.
PENDING_MEDIA_TTL = timedelta(days=1)

# Files are served from this site's host, so only types a browser renders
# as media are allowed. SVG is omitted: it would run as same-origin script.
_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".weba",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "video/quicktime": ".mov",
}


def _file_size(file: UploadFile) -> int:
    if file.size is not None:
        return file.size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    return size


def _display_name(filename: str | None) -> str:
    name = PurePath((filename or "").replace("\\", "/")).name
    return name[:255] or "file"


async def _delete_stale_pending(session: AsyncSession) -> None:
    cutoff = datetime.now(UTC) - PENDING_MEDIA_TTL
    result = await session.execute(
        select(PostMedia).where(
            PostMedia.post_id.is_(None),
            PostMedia.created_at < cutoff,
        )
    )
    stale = list(result.scalars().all())
    if not stale:
        return
    for media in stale:
        await session.delete(media)
    await session.flush()
    await asyncio.to_thread(delete_objects, [m.key for m in stale])


@router.post("/media", response_model=MediaRead)
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    purpose: Literal["attachment", "cover"] = Form("attachment"),
    session: AsyncSession = Depends(get_session),
) -> PostMedia:
    """Store one file and return it. The post form attaches it on save.

    Requires the same admin session cookie as ``/admin``.
    """
    if session_admin_username(request) is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login required",
        )

    content_type = (file.content_type or "").split(";", 1)[0].strip().lower()
    extension = _EXTENSIONS.get(content_type)
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only images, audio, and video can be attached",
        )
    kind = content_type.split("/", 1)[0]
    if purpose == "cover" and kind != "image":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="A cover must be an image",
        )

    size = _file_size(file)
    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )
    if size > settings.media_upload_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File is too large",
        )

    await _delete_stale_pending(session)

    # The key ignores the user-controlled filename; the extension comes
    # from the allowed content type.
    key = f"posts/{uuid4().hex}{extension}"
    await asyncio.to_thread(upload_fileobj, key, file.file, content_type)

    media = PostMedia(
        key=key,
        kind=kind,
        content_type=content_type,
        filename=_display_name(file.filename),
        size=size,
        is_attachment=purpose == "attachment",
        is_cover=False,
    )
    session.add(media)
    await session.flush()
    return media

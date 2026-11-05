"""Upload images, audio, and video from the admin post editor."""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse

from app.admin.auth import session_admin_username
from app.settings import settings
from app.storage import put_object

router = APIRouter(prefix="/api/admin", tags=["admin-media"])

_MEDIA_JS = (
    Path(__file__).resolve().parents[1]
    / "admin"
    / "static"
    / "tinymce-media.js"
)

# TinyMCE stores the returned URL in post HTML, so the type must be something
# a browser can render. SVG is omitted: objects are served from this site's
# host, and an SVG would run as a same-origin script.
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


@router.get("/tinymce-media.js", include_in_schema=False)
def tinymce_media_script() -> FileResponse:
    """File-picker script for the post editor. Not a secret."""
    return FileResponse(_MEDIA_JS, media_type="application/javascript")


@router.post("/media")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
) -> dict[str, str]:
    """Store one file and return ``{"location": url}`` for TinyMCE.

    Requires the same admin session cookie as ``/admin``. The URL does not
    expire; the bucket allows anonymous reads of object bytes.
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
            detail="Only images, audio, and video can be added to a post",
        )

    body = await file.read()
    if not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )
    if len(body) > settings.media_upload_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File is too large",
        )

    # Ignore the original filename. It is user-controlled and may contain
    # path segments. The extension comes from the allowed content type.
    key = f"posts/{uuid4().hex}{extension}"
    return {"location": put_object(key, body, content_type)}

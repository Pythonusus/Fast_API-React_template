"""Presigned download URLs for objects in the S3 bucket."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.files import FileUrl
from app.storage import presign_get_url

router = APIRouter(prefix="/api/files", tags=["files"])


def _object_key(object_name: str) -> str:
    key = object_name.strip("/")
    parts = key.split("/")
    if not key or any(part in ("", ".", "..") for part in parts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid object name",
        )
    return key


@router.get("/{object_name:path}", response_model=FileUrl)
def get_file_url(object_name: str) -> FileUrl:
    """Presigned GET URL, valid for one hour.

    Signing does not contact storage, so a missing object is not a 404
    here. The browser gets 404 from storage when it opens the URL.
    """
    return FileUrl(url=presign_get_url(_object_key(object_name)))

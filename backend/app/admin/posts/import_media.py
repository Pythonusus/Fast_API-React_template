"""Turn exported media links into files owned by the imported post.

The export cell is a JSON list of public URLs plus the flags the form
stores (cover, gallery visibility). Import copies each object to a new
key so deleting one post does not remove the other's files, then
rewrites those URLs inside the HTML body.
"""

import asyncio
from pathlib import PurePath
from typing import Any
from uuid import uuid4

from app.db.posts.models import MediaSelection, Post, PostMedia
from app.settings import settings
from app.storage import (
    copy_object,
    delete_objects,
    object_key_from_public_url,
)

# Same allow-list as the upload endpoint. Import must not attach a type
# the form would refuse.
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

_KINDS = {"image", "video", "audio"}


def media_import_error(items: object) -> str | None:
    """Russian form error for a media cell, or ``None`` when it is usable."""
    if not isinstance(items, list):
        return "Медиа: ожидается список"
    attachments = 0
    for item in items:
        if not isinstance(item, dict):
            return "Медиа: каждая запись должна быть объектом"
        message = _item_error(item)
        if message:
            return message
        if item.get("is_attachment", True):
            attachments += 1
    max_count = settings.post_media_max_count
    if attachments > max_count:
        return f"Не больше {max_count} вложений"
    return None


def rewrite_media_urls(content: str, pairs: list[tuple[str, str]]) -> str:
    """Replace exported URLs with the copied objects' URLs.

    Longer URLs first, so one link cannot eat the start of another.
    """
    ordered = sorted(pairs, key=lambda pair: len(pair[0]), reverse=True)
    for old, new in ordered:
        content = content.replace(old, new)
    return content


def copy_imported_media(
    items: list[dict[str, Any]],
) -> tuple[MediaSelection, list[tuple[str, str]]]:
    """Copy every listed object. Returns the selection and URL replacements.

    On failure, copies made so far are deleted. Blocking boto3.
    """
    error = media_import_error(items)
    if error:
        raise ValueError(error)

    created: list[str] = []
    attachments: list[PostMedia] = []
    cover: PostMedia | None = None
    replacements: list[tuple[str, str]] = []
    try:
        for item in items:
            media, old_url = _copy_item(item, created)
            replacements.append((old_url, media.url))
            if item.get("is_cover") and media.kind == "image":
                cover = media
            if item.get("is_attachment", True):
                attachments.append(media)
        return MediaSelection(
            attachments=attachments, cover=cover
        ), replacements
    except Exception:
        if created:
            delete_objects(created)
        raise


async def apply_pending_media_import(post: Post) -> None:
    """Copy imported files onto ``post`` if this save came from import.

    A form save leaves ``pending_media_import`` as ``None`` and is ignored.
    """
    pending = getattr(post, "pending_media_import", None)
    if not isinstance(pending, list):
        return
    selection, pairs = await asyncio.to_thread(copy_imported_media, pending)
    if pairs and post.content:
        post.content = rewrite_media_urls(post.content, pairs)
    post.media_selection = selection


def _item_error(item: dict[str, Any]) -> str | None:
    url = str(item.get("url") or "")
    if object_key_from_public_url(url) is None:
        return "Медиа: ссылка должна вести в хранилище этого сайта"
    kind = item.get("kind")
    if kind not in _KINDS:
        return "Медиа: тип должен быть image, video или audio"
    if _EXTENSIONS.get(str(item.get("content_type") or "")) is None:
        return "Медиа: этот тип файла прикреплять нельзя"
    if item.get("is_cover") and kind != "image":
        return "Обложка должна быть изображением"
    return None


def _copy_item(
    item: dict[str, Any], created: list[str]
) -> tuple[PostMedia, str]:
    url = str(item["url"])
    source_key = object_key_from_public_url(url)
    if source_key is None:
        raise ValueError("Медиа: ссылка должна вести в хранилище этого сайта")
    content_type = str(item["content_type"])
    extension = _EXTENSIONS[content_type]
    dest_key = f"posts/{uuid4().hex}{extension}"
    filename = _filename(item.get("filename"))
    try:
        copy_object(source_key, dest_key)
    except ValueError as exc:
        raise ValueError(f"Не удалось скопировать файл «{filename}»") from exc
    created.append(dest_key)
    size = item.get("size")
    media = PostMedia(
        key=dest_key,
        kind=str(item["kind"]),
        content_type=content_type,
        filename=filename,
        size=size if isinstance(size, int) and size > 0 else 1,
        is_attachment=bool(item.get("is_attachment", True)),
        is_cover=False,
        show_in_gallery=item.get("show_in_gallery", True) is not False,
    )
    return media, url


def _filename(value: object) -> str:
    name = PurePath(str(value or "file").replace("\\", "/")).name
    return (name or "file")[:255]

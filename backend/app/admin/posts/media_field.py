"""
Admin form field for a post's gallery attachments and cover.

Separate model due to the complexity of the field.
Used by app/admin/posts/views.py to display the media field in the admin panel.

Files are uploaded right away to ``/api/admin/media`` by
``static/posts/media.js``, which creates unattached ``PostMedia`` rows.
The form then submits two hidden inputs:

- ``media_selection``: JSON list of ``{"id", "show_in_gallery"}`` in order
- ``media_selection_cover``: cover id, or empty

``parse_form_data`` turns them into a ``MediaSelection``; the admin then
assigns it to ``Post.media_selection``, which attaches the rows.

Export writes the same files as a JSON list of public URLs. Import
returns that list; ``Post.media_selection`` keeps it pending until
``apply_pending_media_import`` copies the objects.
"""

import json
from dataclasses import dataclass
from typing import Any

from sqlalchemy import or_, select
from starlette.datastructures import FormData
from starlette.requests import Request
from starlette_admin.exceptions import FormValidationError
from starlette_admin.fields import BaseField, BooleanField
from starlette_admin.helpers import static_url
from starlette_admin.types import RequestAction

from app.db.posts.models import MediaSelection, PostMedia
from app.settings import settings

UPLOAD_URL = "/api/admin/media"


@dataclass
class ShowGalleryField(BooleanField):
    """Gallery toggle; checked by default on the create form.

    Hidden on the list. The column header is wider than the checkmark
    and pushes the table into a horizontal scroll.
    """

    exclude_from_list: bool | None = True

    async def serialize_value(self, request: Request, value: Any) -> bool:
        if value is None:
            return True
        return bool(value)


def _parse_id(raw: Any) -> int | None:
    try:
        value = int(str(raw))
    except ValueError:
        return None
    return value if value > 0 else None


def _parse_entry(value: Any) -> tuple[int | None, bool]:
    """One gallery entry: a bare id, or ``{id, show_in_gallery}``."""
    if isinstance(value, dict):
        return _parse_id(value.get("id")), value.get(
            "show_in_gallery"
        ) is not False
    return _parse_id(value), True


def _parse_attachment_entries(raw: Any) -> list[tuple[int, bool]]:
    try:
        values = json.loads(str(raw or "[]"))
    except ValueError:
        return []
    if not isinstance(values, list):
        return []
    entries: list[tuple[int, bool]] = []
    seen: set[int] = set()
    for value in values:
        media_id, shown = _parse_entry(value)
        if media_id is None or media_id in seen:
            continue
        seen.add(media_id)
        entries.append((media_id, shown))
    return entries


def _media_json(media: PostMedia) -> dict[str, Any]:
    return {
        "id": media.id,
        "kind": media.kind,
        "content_type": media.content_type,
        "filename": media.filename,
        "url": media.url,
        "show_in_gallery": media.show_in_gallery is not False,
    }


def export_media(selection: MediaSelection | None) -> list[dict[str, Any]]:
    """Rows written into the post export, including a separate cover."""
    if selection is None:
        return []
    rows = [
        _export_row(media, is_attachment=True)
        for media in selection.attachments
    ]
    cover = selection.cover
    if cover is not None and all(
        cover is not item for item in selection.attachments
    ):
        rows.append(_export_row(cover, is_attachment=False))
    return rows


def _export_row(media: PostMedia, *, is_attachment: bool) -> dict[str, Any]:
    return {
        "url": media.url,
        "kind": media.kind,
        "content_type": media.content_type,
        "filename": media.filename,
        "size": media.size,
        "is_attachment": is_attachment,
        "is_cover": bool(media.is_cover),
        "show_in_gallery": media.show_in_gallery is not False,
    }


@dataclass
class PostMediaField(BaseField):
    form_template: str = "posts/form/media.html"
    detail_template: str = "posts/detail/media.html"
    exclude_from_list: bool | None = True
    exclude_from_export: bool | None = False
    exclude_from_import: bool | None = False
    searchable: bool | None = False
    orderable: bool | None = False

    @property
    def max_count(self) -> int:
        return settings.post_media_max_count

    @property
    def max_bytes(self) -> int:
        return settings.media_upload_max_bytes

    @property
    def upload_url(self) -> str:
        return UPLOAD_URL

    async def parse_import_value(
        self, request: Request, value: Any
    ) -> list[Any]:
        """JSON list of media links. Copying happens when the post is saved."""
        del request
        if value is None or value == "":
            return []
        parsed = value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except ValueError as exc:
                raise FormValidationError(
                    {"media_selection": "Медиа: не удалось прочитать JSON"}
                ) from exc
        if not isinstance(parsed, list):
            raise FormValidationError(
                {"media_selection": "Медиа: ожидается список"}
            )
        return parsed

    async def parse_form_data(
        self, request: Request, form_data: FormData
    ) -> MediaSelection:
        entries = _parse_attachment_entries(form_data.get(self.id))
        ids = [media_id for media_id, _shown in entries]
        cover_id = _parse_id(form_data.get(f"{self.id}_cover"))
        wanted = {*ids, *([cover_id] if cover_id else [])}
        if not wanted:
            return MediaSelection()

        # Only unattached uploads or rows of the post being edited.
        # Ids from another post are ignored.
        post_id = _parse_id(request.query_params.get("pk"))
        owner = PostMedia.post_id.is_(None)
        if post_id is not None:
            owner = or_(owner, PostMedia.post_id == post_id)
        result = await request.state.session.execute(
            select(PostMedia).where(PostMedia.id.in_(wanted), owner)
        )
        rows = {media.id: media for media in result.scalars().all()}

        cover = rows.get(cover_id) if cover_id else None
        if cover is not None and cover.kind != "image":
            cover = None
        attachments: list[PostMedia] = []
        for media_id, shown in entries:
            media = rows.get(media_id)
            if media is None:
                continue
            media.show_in_gallery = shown
            attachments.append(media)
        return MediaSelection(attachments=attachments, cover=cover)

    async def serialize_value(self, request: Request, value: Any) -> Any:
        # Form and detail templates read the selection itself.
        # Export is a JSON string so a CSV cell round-trips through import.
        action = request.state.action
        if action.is_form() or action == RequestAction.DETAIL:
            return value
        selection = value if isinstance(value, MediaSelection) else None
        if action == RequestAction.EXPORT:
            return json.dumps(export_media(selection), ensure_ascii=False)
        return self.initial_state(value)

    def form_value(self, value: Any) -> str:
        """Hidden-input JSON: id plus whether the file stays in the gallery."""
        state = self.initial_state(value)
        payload = [
            {"id": item["id"], "show_in_gallery": item["show_in_gallery"]}
            for item in state["attachments"]
        ]
        return json.dumps(payload)

    def initial_state(self, value: Any) -> dict[str, Any]:
        """JSON for the form script: current attachments and cover."""
        selection = value if isinstance(value, MediaSelection) else None
        if selection is None:
            return {"attachments": [], "cover": None}
        return {
            "attachments": [_media_json(m) for m in selection.attachments],
            "cover": _media_json(selection.cover) if selection.cover else None,
        }

    def additional_css_links(self, request: Request) -> list[str]:
        return [static_url(request, "posts/media.css", v=24)]

    def additional_js_links(self, request: Request) -> list[str]:
        if self._needs_form_assets(request):
            return [static_url(request, "posts/media.js", v=14)]
        return []

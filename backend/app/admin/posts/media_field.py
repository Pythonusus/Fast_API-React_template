"""
Admin form field for a post's gallery attachments and cover.

Files are uploaded right away to ``/api/admin/media`` by
``static/js/post-media.js``, which creates unattached ``PostMedia`` rows.
The form then submits two hidden inputs:

- ``media_selection``: JSON list of attachment ids in gallery order
- ``media_selection_cover``: cover id, or empty

``parse_form_data`` turns them into a ``MediaSelection``; the admin then
assigns it to ``Post.media_selection``, which attaches the rows.
"""

import json
from dataclasses import dataclass
from typing import Any

from sqlalchemy import or_, select
from starlette.datastructures import FormData
from starlette.requests import Request
from starlette_admin.fields import BaseField
from starlette_admin.helpers import static_url
from starlette_admin.types import RequestAction

from app.db.posts.models import MediaSelection, PostMedia
from app.settings import settings

UPLOAD_URL = "/api/admin/media"


def _parse_id(raw: Any) -> int | None:
    try:
        value = int(str(raw))
    except ValueError:
        return None
    return value if value > 0 else None


def _parse_ids(raw: Any) -> list[int]:
    try:
        values = json.loads(str(raw or "[]"))
    except ValueError:
        return []
    if not isinstance(values, list):
        return []
    ids = (_parse_id(value) for value in values)
    return list(dict.fromkeys(i for i in ids if i is not None))


def _media_json(media: PostMedia) -> dict[str, Any]:
    return {
        "id": media.id,
        "kind": media.kind,
        "filename": media.filename,
        "url": media.url,
    }


@dataclass
class PostMediaField(BaseField):
    form_template: str = "fields/form/post_media.html"
    detail_template: str = "fields/detail/post_media.html"
    exclude_from_list: bool | None = True
    exclude_from_export: bool | None = True
    exclude_from_import: bool | None = True
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

    async def parse_form_data(
        self, request: Request, form_data: FormData
    ) -> MediaSelection:
        ids = _parse_ids(form_data.get(self.id))
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
        return MediaSelection(
            attachments=[rows[i] for i in ids if i in rows],
            cover=cover,
        )

    async def serialize_value(self, request: Request, value: Any) -> Any:
        # Form and detail templates read the selection itself. Anything
        # else (JSON responses) gets plain data.
        action = request.state.action
        if action.is_form() or action == RequestAction.DETAIL:
            return value
        return self.initial_state(value)

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
        return [static_url(request, "css/post-media.css", v=1)]

    def additional_js_links(self, request: Request) -> list[str]:
        if self._needs_form_assets(request):
            return [static_url(request, "js/post-media.js", v=1)]
        return []

"""
Admin view for the Post model.

How to register a new model in admin later
-----------------------------------------
Mirror this package (same layout as ``app.db.<entity>``):

1. Add the SQLAlchemy model under ``app/db/<entity>/models.py`` (and
   migrate the DB as usual).
2. Create ``app/admin/<entity>/`` with an empty ``__init__.py`` and a
   ``views.py`` that defines ``class <Entity>Admin(ModelView)`` — copy
   this file and adjust ``menu_label``, ``fields``, search/sort, hooks.
3. In ``app/admin/__init__.py`` ``create_admin()``::

       from app.admin.<entity>.views import <Entity>Admin
       from app.db.<entity>.models import <Entity>

       admin.add_view(<Entity>Admin(<Entity>))

4. Restart the backend; the model appears in the admin sidebar.

No auth or SessionMiddleware changes are needed — those are shared.
"""

import asyncio
import re
from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError
from starlette.requests import Request
from starlette_admin.contrib.sqla import ModelView
from starlette_admin.exceptions import FormValidationError
from starlette_admin.fields import (
    BooleanField,
    DateTimeField,
    IntegerField,
    StringField,
    TinyMCEEditorField,
)
from starlette_admin.helpers import (
    pydantic_error_to_form_validation_errors,
    static_url,
)
from starlette_admin.types import RequestAction

from app.admin.posts.import_media import (
    apply_pending_media_import,
    media_import_error,
)
from app.admin.posts.media_field import PostMediaField, ShowGalleryField
from app.db.posts import crud
from app.db.posts.models import MediaSelection, Post
from app.schemas.posts import PostCreate, PostRead
from app.settings import settings
from app.storage import delete_objects

# datetime-local accepts no fraction, or exactly three millisecond digits.
_DATETIME_FRACTION = re.compile(r"\.(\d+)")


def form_saves_draft(form: Any) -> bool:
    """True when the clicked button keeps a new post unpublished.

    ``_save_draft`` is the draft button. ``_continue_editing=draft`` is
    that same save, then the edit form. Every other submit publishes.
    A post that is already published ignores this.
    """
    if form.get("_save_draft") is not None:
        return True
    return form.get("_continue_editing") == "draft"


def _datetime_local_value(value: str) -> str:
    """Drop extra fraction digits so a datetime-local input keeps the value."""

    def trim(match: re.Match[str]) -> str:
        millis = match.group(1)[:3].ljust(3, "0")
        if millis == "000":
            return ""
        return f".{millis}"

    return _DATETIME_FRACTION.sub(trim, value, count=1)


@dataclass
class PostDateTimeField(DateTimeField):
    """Read-only timestamp whose edit value fits a datetime-local input.

    Python's ``isoformat`` writes six fractional digits. The browser rejects
    that and logs a format warning, so the form value stops at milliseconds.
    """

    # Milliseconds. The input default step is whole minutes.
    step: str = "0.001"

    async def serialize_value(self, request: Request, value: Any) -> str:
        result = await super().serialize_value(request, value)
        if request.state.action.is_form():
            return _datetime_local_value(result)
        return result


@dataclass
class DraftStatusField(BooleanField):
    """Draft badge on the list and detail pages. The form buttons set it."""

    read_only: bool = True
    exclude_from_create: bool = True
    exclude_from_edit: bool = True
    exclude_from_import: bool = True
    list_template: str = "posts/list/draft.html"
    detail_template: str = "posts/detail/draft.html"


@dataclass
class PostContentField(TinyMCEEditorField):
    """Post body.

    The detail page is outside the TinyMCE iframe, so it loads its own cap.
    """

    detail_template: str = "posts/detail/content.html"

    def additional_css_links(self, request: Request) -> list[str]:
        if request.state.action == RequestAction.DETAIL:
            return [static_url(request, "posts/content.css", v=3)]
        return []


class PostAdmin(ModelView):
    """
    Admin view for the Post model.

    Configures:
    - Displayed fields
    - Searchable fields
    - Sorting
    - Lifecycle hooks

    Validation reuses ``PostCreate`` (same rules as the public API). The ORM
    ``nullable=False`` only blocks SQL NULL — empty strings still need this.
    """

    # Sidebar / page title (plural) and singular entity name
    menu_label = "Посты"
    display_name = "Пост"

    # Font Awesome newspaper icon
    icon = "fa fa-newspaper"

    # Columns in the list table (left to right)
    list_fields = ["id", "title", "is_draft", "created_at", "updated_at"]

    # Fields included in search
    searchable_fields = ["title", "content"]

    # Sortable columns
    sortable_fields = ["id", "title", "is_draft", "created_at", "updated_at"]

    # Newest posts first
    default_sort = [("created_at", "desc")]

    # The list page already offers Export and Import (CSV and JSON).
    # ``id`` is in the file for reference and ignored on import, so a
    # round-trip always creates a new post instead of overwriting one.
    detail_template = "posts/detail.html"
    create_template = "posts/create.html"
    edit_template = "posts/edit.html"

    # Editable form fields
    fields = [
        IntegerField(
            "id", label="ID", read_only=True, exclude_from_import=True
        ),
        StringField("title", label="Заголовок", required=True),
        # Do not set required=True: TinyMCE hides the <textarea>, and the
        # browser then refuses submit with "invalid form control is not
        # focusable". Emptiness is still enforced in validate() via PostCreate.
        #
        # Toolbar + plugins are the open-source TinyMCE 6 set (jsDelivr CDN,
        # no Tiny Cloud API key). Gallery files below can be dragged into the
        # body to embed S3 media; raw file drops stay blocked (no base64).
        PostContentField(
            "content",
            label="Содержание",
            # Tall enough to draft in without dragging the status bar.
            height=900,
            menubar="file edit view insert format tools help",
            statusbar=True,
            toolbar=(
                "undo redo | blocks fontfamily fontsize | "
                "bold italic underline strikethrough | "
                "forecolor backcolor | "
                "alignleft aligncenter alignright alignjustify | "
                "bullist numlist outdent indent | table | "
                "blockquote subscript superscript | "
                "link unlink charmap emoticons hr | "
                "removeformat | searchreplace visualblocks code fullscreen "
                "preview | postgallery | help"
            ),
            content_style=(
                "body { font-family: -apple-system, BlinkMacSystemFont, "
                "San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; "
                "font-size: 14px; -webkit-font-smoothing: antialiased; } "
                "img, video, audio { max-width: 100%; display: block; "
                "margin: 0.75em 0; } "
                # Same cap as ``.app-inner-html`` and
                # ``static/posts/content.css`` (the admin detail page).
                # width/height auto and object-fit
                # keep the ratio when a tall image hits 32rem.
                # The video/audio rule below still stretches players to the
                # column; object-fit stops that from squashing the picture.
                "img, video { width: auto; height: auto; max-height: 32rem; "
                "margin-inline: auto; object-fit: contain; } "
                "video, audio { width: 100%; } "
                "table { border-collapse: collapse; width: 100%; } "
                "td, th { border: 1px solid #ccc; padding: 0.4em; }"
            ),
            extra_options={
                "plugins": (
                    "advlist autolink lists link charmap preview anchor "
                    "searchreplace visualblocks code fullscreen insertdatetime "
                    "emoticons help wordcount table postgallery"
                ),
                "toolbar_mode": "sliding",
                # A phone ignores the desktop mode and scrolls the toolbar
                # sideways. Sliding keeps one row and a button for the rest.
                "mobile": {"toolbar_mode": "sliding"},
                "branding": False,
                "promotion": False,
                "link_default_target": "_blank",
                "link_assume_external_targets": True,
                # Pasted or dropped local files must not become base64 in HTML.
                # Gallery embeds are inserted by ``static/posts/media.js``.
                "paste_data_images": False,
                "block_unsupported_drop": True,
                "extended_valid_elements": (
                    "img[src|alt|width|height|class],"
                    "video[src|controls|playsinline|width|height|class|preload],"
                    "audio[src|controls|class|preload]"
                ),
                # Keep foreign embeds out; S3 gallery media is fine.
                "invalid_elements": "iframe,object,embed,picture,source",
            },
        ),
        PostMediaField("media_selection", label="Медиа"),
        ShowGalleryField(
            "show_gallery",
            label="Показывать галерею",
            help_text=(
                "Если выключено, вложения на странице поста не дублируются "
                "галереей — только то, что вставлено в текст."
            ),
        ),
        DraftStatusField("is_draft", label="Статус"),
        PostDateTimeField(
            "created_at",
            read_only=True,
            label="Создан",
            exclude_from_import=True,
        ),
        PostDateTimeField(
            "updated_at",
            read_only=True,
            label="Обновлён",
            exclude_from_import=True,
        ),
    ]

    # Auto-managed fields — hide on create
    exclude_fields_from_create = ["id", "created_at", "updated_at", "is_draft"]

    # Hide immutable / auto fields on edit. A published post cannot go
    # back to a draft; the buttons below set ``is_draft`` themselves.
    exclude_fields_from_edit = ["id", "created_at", "is_draft"]

    # -------------------------------------------------------------------------
    def _additional_css_links(self, request: Request) -> list[str]:
        """Page CSS for the post list, form, and detail."""
        links = list(super()._additional_css_links(request))
        action = request.state.action
        if action == RequestAction.LIST:
            link = static_url(request, "posts/list.css", v=1)
            if link not in links:
                links.append(link)
        if action in (RequestAction.LIST, RequestAction.DETAIL):
            link = static_url(request, "posts/status.css", v=1)
            if link not in links:
                links.append(link)
        if action in (
            RequestAction.CREATE,
            RequestAction.EDIT,
            RequestAction.DETAIL,
        ):
            link = static_url(request, "posts/layout.css", v=4)
            if link not in links:
                links.append(link)
        return links

    def _additional_js_links(self, request: Request) -> list[str]:
        """Preview buttons open the React app. They do not redraw the post."""
        links = list(super()._additional_js_links(request))
        action = request.state.action
        if action in (
            RequestAction.CREATE,
            RequestAction.EDIT,
            RequestAction.DETAIL,
        ):
            link = static_url(request, "posts/preview.js", v=3)
            if link not in links:
                links.append(link)
        return links

    def public_preview(self, post: Post) -> dict[str, Any]:
        """Saved post in the same shape the public app already renders."""
        return PostRead.model_validate(post).model_dump(mode="json")

    # Framework hooks — override fixed method names; the admin panel calls them.
    # You do not register these yourself (no decorator / no add_hook).
    #
    # Create / edit submit order (simplified):
    #   1. Parse form → ``data``
    #   2. Per-field checks (``required``, field ``validators``)
    #   3. ``validate(request, data)``      ← raise FormValidationError to abort
    #   4. ``before_create`` / ``before_edit``
    #   5. Persist to DB
    #   6. ``after_create`` / ``after_edit``
    #
    # Delete: ``before_delete`` → DELETE → ``after_delete``.
    # Base ``ModelView`` stubs are no-ops; only overrides you define run.
    # See: https://jowilf.github.io/starlette-admin/api/views/
    # -------------------------------------------------------------------------

    async def validate(self, request: Request, data: dict[str, Any]) -> None:
        """
        Cross-field / schema validation before create or edit is saved.

        Called by the admin panel after field-level checks, by this exact
        method name. Raise ``FormValidationError`` to redisplay the form
        with errors and skip the DB write.

        We reuse ``PostCreate`` so admin matches the public API rules.
        Admin writes the ORM directly and does not run Pydantic unless we
        call it here. ``nullable=False`` on the model still allows ``""``.
        """
        selection = data.get("media_selection")
        max_count = settings.post_media_max_count
        if isinstance(selection, list):
            message = media_import_error(selection)
            if message:
                raise FormValidationError({"media_selection": message})
        elif (
            isinstance(selection, MediaSelection)
            and len(selection.attachments) > max_count
        ):
            raise FormValidationError(
                {"media_selection": f"Не больше {max_count} вложений"}
            )
        try:
            PostCreate.model_validate(
                {
                    "title": data.get("title") or "",
                    "content": data.get("content") or "",
                    "show_gallery": data.get("show_gallery", True),
                }
            )
        except ValidationError as exc:
            # Maps Pydantic field errors → admin form field errors.
            raise pydantic_error_to_form_validation_errors(exc) from exc

    async def before_create(
        self,
        request: Request,
        data: dict[str, Any],
        obj: Post,
    ) -> None:
        """
        Called by the admin panel before a new row is inserted.

        Use for defaults or side effects (validation belongs in ``validate``).

        Args:
            request: HTTP request
            data: Form data
            obj: Model instance being created
        """
        await self._apply_imported_media(obj)
        # Import has no draft button. An imported post is published.
        if request.state.action == RequestAction.CREATE:
            obj.is_draft = form_saves_draft(await request.form())
        print(f"[ADMIN] Creating post: {obj.title}")

    async def after_create(
        self,
        request: Request,
        obj: Post,
    ) -> None:
        """
        Called by the admin panel after a new row is committed.

        Use for notifications, cache invalidation, or logging.

        Args:
            request: HTTP request
            obj: Created model instance
        """
        print(f"[ADMIN] Post created: ID={obj.id}, Title={obj.title}")

    async def before_edit(
        self,
        request: Request,
        data: dict[str, Any],
        obj: Post,
    ) -> None:
        """
        Called by the admin panel before an existing row is updated.

        Args:
            request: HTTP request
            data: Form data
            obj: Model instance being edited
        """
        await self._apply_imported_media(obj)
        # Drafts exist only while a new post is unfinished. Saving a
        # published post always leaves it published.
        if request.state.action == RequestAction.EDIT and not (
            obj.is_draft and form_saves_draft(await request.form())
        ):
            obj.is_draft = False
        print(f"[ADMIN] Editing post: ID={obj.id}")

    async def after_edit(
        self,
        request: Request,
        obj: Post,
    ) -> None:
        """
        Called by the admin panel after an edit is committed.

        Args:
            request: HTTP request
            obj: Updated model instance
        """
        print(f"[ADMIN] Post updated: ID={obj.id}, Title={obj.title}")

    async def after_edit_committed(self, request: Request, obj: Post) -> None:
        """
        Called after the edit transaction is committed.

        Deletes storage objects of attachments or covers removed in the
        form. Done only after the commit, so a failed save keeps the files.
        """
        keys = getattr(obj, "removed_media_keys", [])
        if keys:
            await asyncio.to_thread(delete_objects, keys)

    async def before_delete(
        self,
        request: Request,
        obj: Post,
    ) -> None:
        """
        Called by the admin panel before a row is deleted.

        Args:
            request: HTTP request
            obj: Model instance being deleted
        """
        print(f"[ADMIN] Deleting post: ID={obj.id}, Title={obj.title}")
        # Rows go with the post (FK cascade). Keys come from the table,
        # not obj.media: that collection is often empty here because of
        # passive_deletes. Files are removed in after_delete_committed.
        obj.removed_media_keys = await crud.list_media_keys(
            request.state.session, obj.id
        )

    async def after_delete(
        self,
        request: Request,
        obj: Post,
    ) -> None:
        """
        Called by admin after a delete is committed.

        Args:
            request: HTTP request
            obj: Deleted model instance
        """
        print(f"[ADMIN] Post deleted: ID={obj.id}")

    async def _apply_imported_media(self, obj: Post) -> None:
        try:
            await apply_pending_media_import(obj)
        except ValueError as exc:
            raise FormValidationError({"media_selection": str(exc)}) from exc

    async def after_delete_committed(self, request: Request, obj: Post) -> None:
        """Delete the post's files once the row deletion is committed."""
        keys = getattr(obj, "removed_media_keys", [])
        if keys:
            await asyncio.to_thread(delete_objects, keys)

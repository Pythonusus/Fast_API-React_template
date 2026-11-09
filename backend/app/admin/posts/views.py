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
from typing import Any

from pydantic import ValidationError
from starlette.requests import Request
from starlette_admin.contrib.sqla import ModelView
from starlette_admin.exceptions import FormValidationError
from starlette_admin.fields import (
    DateTimeField,
    IntegerField,
    StringField,
    TinyMCEEditorField,
)
from starlette_admin.helpers import pydantic_error_to_form_validation_errors

from app.admin.posts.media_field import PostMediaField
from app.db.posts import crud
from app.db.posts.models import MediaSelection, Post
from app.schemas.posts import PostCreate
from app.settings import settings
from app.storage import delete_objects


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
    list_fields = ["id", "title", "created_at", "updated_at"]

    # Fields included in search
    searchable_fields = ["title", "content"]

    # Sortable columns
    sortable_fields = ["id", "title", "created_at", "updated_at"]

    # Newest posts first
    default_sort = [("created_at", "desc")]

    # Editable form fields
    fields = [
        IntegerField("id", label="ID", read_only=True),
        StringField("title", label="Заголовок", required=True),
        # Do not set required=True: TinyMCE hides the <textarea>, and the
        # browser then refuses submit with "invalid form control is not
        # focusable". Emptiness is still enforced in validate() via PostCreate.
        #
        # Toolbar + plugins are the open-source TinyMCE 6 set (jsDelivr CDN,
        # no Tiny Cloud API key). Images, video, and audio go to the media
        # gallery below, not into the HTML.
        TinyMCEEditorField(
            "content",
            label="Содержание",
            height=420,
            menubar="file edit view insert format tools help",
            statusbar=True,
            toolbar=(
                "undo redo | blocks fontfamily fontsize | "
                "bold italic underline strikethrough | "
                "forecolor backcolor | "
                "alignleft aligncenter alignright alignjustify | "
                "bullist numlist outdent indent | "
                "blockquote subscript superscript | "
                "link unlink charmap emoticons hr | "
                "removeformat | searchreplace visualblocks code fullscreen "
                "preview | help"
            ),
            extra_options={
                "plugins": (
                    "advlist autolink lists link charmap preview anchor "
                    "searchreplace visualblocks code fullscreen insertdatetime "
                    "emoticons help wordcount"
                ),
                "toolbar_mode": "sliding",
                "branding": False,
                "promotion": False,
                "link_default_target": "_blank",
                "link_assume_external_targets": True,
                # Pasted or dropped images would otherwise land in the HTML
                # as base64. Embedded media is stripped from source edits.
                "paste_data_images": False,
                "invalid_elements": (
                    "img,picture,video,audio,source,iframe,object,embed"
                ),
            },
        ),
        PostMediaField("media_selection", label="Медиа"),
        DateTimeField("created_at", read_only=True, label="Создан"),
        DateTimeField("updated_at", read_only=True, label="Обновлён"),
    ]

    # Auto-managed fields — hide on create
    exclude_fields_from_create = ["id", "created_at", "updated_at"]

    # Hide immutable / auto fields on edit
    exclude_fields_from_edit = ["id", "created_at"]

    # -------------------------------------------------------------------------
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
        if (
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

    async def after_delete_committed(self, request: Request, obj: Post) -> None:
        """Delete the post's files once the row deletion is committed."""
        keys = getattr(obj, "removed_media_keys", [])
        if keys:
            await asyncio.to_thread(delete_objects, keys)

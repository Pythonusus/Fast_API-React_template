"""
Admin view for the Post model.

How to register a new model in admin later
-----------------------------------------
Mirror this package (same layout as ``app.db.<entity>``):

1. Add the SQLAlchemy model under ``app/db/<entity>/models.py`` (and
   migrate the DB as usual).
2. Create ``app/admin/<entity>/`` with an empty ``__init__.py`` and a
   ``views.py`` that defines ``class <Entity>Admin(ModelView)`` — copy
   this file and adjust ``label``, ``fields``, search/sort, hooks.
3. In ``app/admin/__init__.py`` ``create_admin()``::

       from app.admin.<entity>.views import <Entity>Admin
       from app.db.<entity>.models import <Entity>

       admin.add_view(<Entity>Admin(<Entity>))

4. Restart the backend; the model appears in the admin sidebar.

No auth or SessionMiddleware changes are needed — those are shared.
"""

from typing import Any

from pydantic import ValidationError
from starlette.requests import Request
from starlette_admin.contrib.sqla import ModelView
from starlette_admin.fields import (
    DateTimeField,
    IntegerField,
    StringField,
    TextAreaField,
)
from starlette_admin.helpers import pydantic_error_to_form_validation_errors

from app.db.posts.models import Post
from app.schemas.posts import PostCreate


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

    # Display labels (singular / plural)
    label = "Post"
    label_plural = "Posts"

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
        IntegerField("id", read_only=True),
        StringField("title", label="Title", required=True),
        TextAreaField("content", label="Content", required=True),
        DateTimeField("created_at", read_only=True, label="Created"),
        DateTimeField("updated_at", read_only=True, label="Updated"),
    ]

    # Auto-managed fields — hide on create
    exclude_fields_from_create = ["id", "created_at", "updated_at"]

    # Hide immutable / auto fields on edit
    exclude_fields_from_edit = ["id", "created_at"]

    # -------------------------------------------------------------------------
    # Framework hooks — override fixed method names; starlette-admin calls them.
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

        Called by starlette-admin after field-level checks, by this exact
        method name. Raise ``FormValidationError`` to redisplay the form
        with errors and skip the DB write.

        We reuse ``PostCreate`` so admin matches the public API rules.
        Admin writes the ORM directly and does not run Pydantic unless we
        call it here. ``nullable=False`` on the model still allows ``""``.
        """
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
        Called by starlette-admin before a new row is inserted.

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
        Called by starlette-admin after a new row is committed.

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
        Called by starlette-admin before an existing row is updated.

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
        Called by starlette-admin after an edit is committed.

        Args:
            request: HTTP request
            obj: Updated model instance
        """
        print(f"[ADMIN] Post updated: ID={obj.id}, Title={obj.title}")

    async def before_delete(
        self,
        request: Request,
        obj: Post,
    ) -> None:
        """
        Called by starlette-admin before a row is deleted.

        Args:
            request: HTTP request
            obj: Model instance being deleted
        """
        print(f"[ADMIN] Deleting post: ID={obj.id}, Title={obj.title}")

    async def after_delete(
        self,
        request: Request,
        obj: Post,
    ) -> None:
        """
        Called by starlette-admin after a delete is committed.

        Args:
            request: HTTP request
            obj: Deleted model instance
        """
        print(f"[ADMIN] Post deleted: ID={obj.id}")

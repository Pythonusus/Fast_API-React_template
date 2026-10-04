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

from starlette.requests import Request
from starlette_admin.contrib.sqla import ModelView
from starlette_admin.fields import (
    DateTimeField,
    IntegerField,
    StringField,
    TextAreaField,
)

from app.db.posts.models import Post


class PostAdmin(ModelView):
    """
    Admin view for the Post model.

    Configures:
    - Displayed fields
    - Searchable fields
    - Sorting
    - Lifecycle hooks
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
        StringField("title", label="Title"),
        TextAreaField("content", label="Content"),
        DateTimeField("created_at", read_only=True, label="Created"),
        DateTimeField("updated_at", read_only=True, label="Updated"),
    ]

    # Auto-managed fields — hide on create
    exclude_fields_from_create = ["id", "created_at", "updated_at"]

    # Hide immutable / auto fields on edit
    exclude_fields_from_edit = ["id", "created_at"]

    # === Lifecycle hooks (async) ===

    async def before_create(
        self,
        request: Request,
        data: dict[str, Any],
        obj: Post,
    ) -> None:
        """
        Called before a new object is saved.

        Use for defaults, validation, or side effects.

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
        Called after a new object is created successfully.

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
        Called before edits are saved.

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
        Called after edits are saved successfully.

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
        Called before an object is deleted.

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
        Called after an object is deleted successfully.

        Args:
            request: HTTP request
            obj: Deleted model instance
        """
        print(f"[ADMIN] Post deleted: ID={obj.id}")

"""
fastapi-filter definition for the public posts list.

Query params (see ``FilterDepends`` in the posts router):

- ``search`` — free-text across title/content
- ``order_by`` — e.g. ``-created_at`` or ``title``
- ``created_at__gte`` / ``created_at__lte`` — inclusive date range
"""

from datetime import datetime
from typing import Any

from fastapi_filter.contrib.sqlalchemy import Filter

from app.db.posts.models import Post


def published_posts(statement: Any) -> Any:
    """Drop drafts from a public posts query.

    Draft rows stay in the database for the admin panel. List, count, and
    detail on ``/api/posts`` all go through this so a draft id is a 404
    and never appears in the list.
    """
    return statement.where(Post.is_draft.is_(False))


class PostFilter(Filter):
    """Allowlisted search / sort / date filters for ``Post`` list queries."""

    order_by: list[str] | None = ["-created_at"]
    search: str | None = None
    created_at__gte: datetime | None = None
    created_at__lte: datetime | None = None

    class Constants(Filter.Constants):
        model = Post
        search_model_fields = ["title", "content"]

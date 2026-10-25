"""
fastapi-filter definition for the public posts list.

Query params (see ``FilterDepends`` in the posts router):

- ``search`` — free-text across title/content
- ``order_by`` — e.g. ``-created_at`` or ``title``
- ``created_at__gte`` / ``created_at__lte`` — inclusive date range
"""

from datetime import datetime

from fastapi_filter.contrib.sqlalchemy import Filter

from app.db.posts.models import Post


class PostFilter(Filter):
    """Allowlisted search / sort / date filters for ``Post`` list queries."""

    order_by: list[str] | None = ["-created_at"]
    search: str | None = None
    created_at__gte: datetime | None = None
    created_at__lte: datetime | None = None

    class Constants(Filter.Constants):
        model = Post
        search_model_fields = ["title", "content"]

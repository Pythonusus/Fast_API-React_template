"""Unit tests for posts list ``PostFilter`` (fastapi-filter)."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.db.posts.query import PostFilter


def test_post_filter_defaults() -> None:
    post_filter = PostFilter()
    assert post_filter.order_by == ["-created_at"]
    assert post_filter.search is None
    assert post_filter.created_at__gte is None
    assert post_filter.created_at__lte is None


def test_post_filter_accepts_search_and_range() -> None:
    start = datetime.fromisoformat("2024-01-01T00:00:00")
    end = datetime.fromisoformat("2024-01-31T23:59:59")
    post_filter = PostFilter(
        search="hello",
        order_by=["title"],
        created_at__gte=start,
        created_at__lte=end,
    )
    assert post_filter.search == "hello"
    assert post_filter.order_by == ["title"]
    assert post_filter.created_at__gte == start
    assert post_filter.created_at__lte == end


def test_post_filter_rejects_unknown_order_field() -> None:
    with pytest.raises(ValidationError):
        PostFilter(order_by=["not_a_field"])

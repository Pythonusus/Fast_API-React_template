"""Presigned file URL route and public-prefix rewriting."""

import pytest
from fastapi import HTTPException

from app.routers.files import _object_key
from app.storage import apply_public_prefix


def test_prefix_is_inserted_before_the_signed_path():
    signed = (
        "https://your-domain.com/blog-media/posts/a.png?X-Amz-Signature=abc"
    )

    url = apply_public_prefix(signed, "https://your-domain.com/s3/")

    assert url == (
        "https://your-domain.com/s3/blog-media/posts/a.png?X-Amz-Signature=abc"
    )


def test_prefix_is_not_doubled():
    signed = "https://your-domain.com/s3/blog-media/a.png?X-Amz-Signature=abc"

    url = apply_public_prefix(signed, "https://your-domain.com/s3/")

    assert url == signed


def test_empty_prefix_leaves_the_url_unchanged():
    signed = "https://storage.example/blog-media/a.png?X-Amz-Signature=abc"

    url = apply_public_prefix(signed, "https://storage.example")

    assert url == signed


def test_file_url_returns_the_presigned_url(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.files.presign_get_url",
        lambda key: f"https://example.test/s3/bucket/{key}?sig=1",
    )

    response = client.get("/api/files/posts/a.png")

    assert response.status_code == 200
    assert response.json() == {
        "url": "https://example.test/s3/bucket/posts/a.png?sig=1"
    }


def test_object_key_rejects_parent_segments():
    # HTTP clients collapse "posts/../secret" before the request is sent,
    # so the guard is tested on the value the route would receive.
    with pytest.raises(HTTPException) as exc_info:
        _object_key("posts/../secret")

    assert exc_info.value.status_code == 400

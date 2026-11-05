"""Admin post-media upload."""

from app.settings import Settings, settings
from app.storage import public_object_url, public_read_policy


def test_public_object_url_uses_the_prefix_and_bucket(monkeypatch):
    monkeypatch.setattr(settings, "s3_public_url", "http://localhost:8100/s3/")
    monkeypatch.setattr(settings, "s3_bucket", "test-bucket")

    assert (
        public_object_url("posts/a.png")
        == "http://localhost:8100/s3/test-bucket/posts/a.png"
    )


def test_public_read_policy_allows_get_object_only():
    policy = public_read_policy("blog-media")

    assert "s3:GetObject" in policy
    assert "arn:aws:s3:::blog-media/*" in policy
    assert "s3:ListBucket" not in policy


def test_upload_requires_an_admin_session(client):
    response = client.post(
        "/api/admin/media",
        files={"file": ("a.png", b"png", "image/png")},
    )

    assert response.status_code == 401


def test_upload_stores_the_file_and_returns_its_url(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.admin_media.session_admin_username",
        lambda request: "admin",
    )
    stored: dict[str, object] = {}

    def fake_put(key: str, body: bytes, content_type: str) -> str:
        stored["key"] = key
        stored["body"] = body
        stored["content_type"] = content_type
        return f"http://localhost:8100/s3/test-bucket/{key}"

    monkeypatch.setattr("app.routers.admin_media.put_object", fake_put)

    response = client.post(
        "/api/admin/media",
        files={"file": ("photo.png", b"png-bytes", "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["location"] == (
        f"http://localhost:8100/s3/test-bucket/{stored['key']}"
    )
    assert stored["body"] == b"png-bytes"
    assert stored["content_type"] == "image/png"
    assert str(stored["key"]).startswith("posts/")
    assert str(stored["key"]).endswith(".png")
    assert "photo" not in str(stored["key"])


def test_upload_rejects_non_media(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.admin_media.session_admin_username",
        lambda request: "admin",
    )

    response = client.post(
        "/api/admin/media",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 415


def test_upload_rejects_oversized_files(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.admin_media.session_admin_username",
        lambda request: "admin",
    )
    monkeypatch.setattr(Settings, "media_upload_max_bytes", 4)

    response = client.post(
        "/api/admin/media",
        files={"file": ("a.png", b"12345", "image/png")},
    )

    assert response.status_code == 413


def test_editor_script_is_served(client):
    response = client.get("/api/admin/tinymce-media.js")

    assert response.status_code == 200
    assert "file_picker_callback" in response.text

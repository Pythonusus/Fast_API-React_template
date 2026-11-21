"""Post attachments, covers, and the admin upload endpoint."""

import asyncio
from datetime import UTC, datetime

import pytest

from app.api import app
from app.db.engine import get_session
from app.db.posts.models import MediaSelection, Post, PostMedia
from app.schemas.posts import PostRead
from app.settings import Settings, settings
from app.storage import public_object_url, public_read_policy


def _media(media_id: int, kind: str = "image") -> PostMedia:
    return PostMedia(
        id=media_id,
        key=f"posts/{media_id}.bin",
        kind=kind,
        content_type=f"{kind}/test",
        filename=f"{media_id}.bin",
        size=1,
        position=0,
        is_attachment=True,
        is_cover=False,
    )


class _EmptyResult:
    def scalars(self):
        return self

    def all(self):
        return []


class _FakeSession:
    def __init__(self):
        self.added = []

    async def execute(self, statement):
        return _EmptyResult()

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            obj.id = 7

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def close(self):
        pass


@pytest.fixture
def admin_upload(client, monkeypatch):
    """Logged-in admin, fake DB session, and a recording S3 upload."""
    monkeypatch.setattr(
        "app.routers.admin_media.session_admin_username",
        lambda request: "admin",
    )
    uploaded: dict[str, object] = {}

    def fake_upload(key, fileobj, content_type):
        uploaded.update(key=key, body=fileobj.read(), content_type=content_type)

    monkeypatch.setattr("app.routers.admin_media.upload_fileobj", fake_upload)
    session = _FakeSession()

    async def override():
        yield session

    app.dependency_overrides[get_session] = override
    yield uploaded, session
    app.dependency_overrides.pop(get_session, None)


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


def test_upload_creates_an_unattached_media_row(admin_upload, client):
    uploaded, session = admin_upload

    response = client.post(
        "/api/admin/media",
        files={"file": ("../photo.png", b"png-bytes", "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 7
    assert body["kind"] == "image"
    assert body["filename"] == "photo.png"
    assert body["url"].endswith(str(uploaded["key"]))
    assert uploaded["body"] == b"png-bytes"
    assert str(uploaded["key"]).startswith("posts/")
    assert "photo" not in str(uploaded["key"])
    (media,) = session.added
    assert media.post_id is None
    assert media.is_attachment is True


def test_cover_upload_is_not_an_attachment(admin_upload, client):
    _, session = admin_upload

    response = client.post(
        "/api/admin/media",
        data={"purpose": "cover"},
        files={"file": ("c.jpg", b"jpg", "image/jpeg")},
    )

    assert response.status_code == 200
    assert session.added[0].is_attachment is False


def test_cover_must_be_an_image(admin_upload, client):
    response = client.post(
        "/api/admin/media",
        data={"purpose": "cover"},
        files={"file": ("v.mp4", b"mp4", "video/mp4")},
    )

    assert response.status_code == 415


def test_upload_rejects_non_media(admin_upload, client):
    response = client.post(
        "/api/admin/media",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 415


def test_upload_rejects_oversized_files(admin_upload, client, monkeypatch):
    monkeypatch.setattr(Settings, "media_upload_max_bytes", 4)

    response = client.post(
        "/api/admin/media",
        files={"file": ("a.png", b"12345", "image/png")},
    )

    assert response.status_code == 413


def test_selection_orders_attachments_and_marks_the_cover():
    a, b, c = _media(1), _media(2, "video"), _media(3)
    post = Post(title="t", content="c")

    post.media_selection = MediaSelection(attachments=[b, a, c], cover=c)

    assert [m.position for m in (b, a, c)] == [0, 1, 2]
    assert c.is_cover and not a.is_cover
    assert post.cover is c
    assert post.gallery == [b, a]


def test_separate_cover_is_kept_out_of_the_gallery():
    a, cover = _media(1), _media(2)
    post = Post(title="t", content="c")

    post.media_selection = MediaSelection(attachments=[a], cover=cover)

    assert cover.is_attachment is False
    assert post.cover is cover
    assert post.gallery == [a]
    assert post.media_selection.attachments == [a]


def test_dropped_media_keys_are_recorded():
    a, b = _media(1), _media(2)
    post = Post(title="t", content="c")
    post.media_selection = MediaSelection(attachments=[a, b], cover=b)

    post.media_selection = MediaSelection(attachments=[a])

    assert post.removed_media_keys == [b.key]
    assert post.cover is None


def test_after_delete_committed_removes_storage_objects(monkeypatch):
    deleted: list[str] = []
    monkeypatch.setattr(
        "app.admin.posts.views.delete_objects",
        lambda keys: deleted.extend(keys),
    )
    post = Post(title="t", content="c")
    post.removed_media_keys = ["posts/a.png", "posts/b.mp4"]

    from app.admin.posts.views import PostAdmin

    asyncio.run(PostAdmin(Post).after_delete_committed(None, post))

    assert deleted == ["posts/a.png", "posts/b.mp4"]


def test_post_read_returns_cover_and_gallery_without_it():
    a, b = _media(1), _media(2)
    now = datetime.now(UTC)
    post = Post(id=1, title="Title", content="<p>x</p>", show_gallery=True)
    post.created_at = post.updated_at = now
    post.media_selection = MediaSelection(attachments=[a, b], cover=a)

    data = PostRead.model_validate(post).model_dump()

    assert data["cover"]["id"] == 1
    assert [m["id"] for m in data["media"]] == [2]
    assert data["show_gallery"] is True


def test_gallery_omits_files_hidden_from_it():
    shown, hidden = _media(1), _media(2, "audio")
    hidden.show_in_gallery = False
    post = Post(title="t", content="c")

    post.media_selection = MediaSelection(attachments=[shown, hidden])

    assert post.gallery == [shown]
    assert post.media_selection.attachments == [shown, hidden]


def test_import_list_stays_pending_until_it_is_applied():
    post = Post(title="t", content="<p>x</p>")

    post.media_selection = [{"url": "http://example/a.jpg"}]

    assert post.pending_media_import == [{"url": "http://example/a.jpg"}]
    assert post.media == []


def test_object_key_from_public_url_rejects_other_hosts():
    from app.storage import object_key_from_public_url

    assert (
        object_key_from_public_url(public_object_url("posts/old.jpg"))
        == "posts/old.jpg"
    )
    assert object_key_from_public_url("https://evil.test/posts/old.jpg") is None


def test_apply_import_copies_media_and_rewrites_the_body(monkeypatch):
    copied: list[tuple[str, str]] = []
    monkeypatch.setattr(
        "app.admin.posts.import_media.copy_object",
        lambda source, dest: copied.append((source, dest)),
    )
    url = public_object_url("posts/old.jpg")
    post = Post(title="t", content=f'<p><img src="{url}"></p>')
    post.media_selection = [
        {
            "url": url,
            "kind": "image",
            "content_type": "image/jpeg",
            "filename": "old.jpg",
            "size": 12,
            "is_attachment": True,
            "is_cover": False,
            "show_in_gallery": False,
        }
    ]

    from app.admin.posts.import_media import apply_pending_media_import

    asyncio.run(apply_pending_media_import(post))

    assert copied and copied[0][0] == "posts/old.jpg"
    assert post.gallery == []
    assert post.media_selection.attachments[0].show_in_gallery is False
    assert url not in post.content
    assert post.media[0].url in post.content


def test_form_value_keeps_the_gallery_flag():
    import json

    from app.admin.posts.media_field import PostMediaField

    shown, hidden = _media(1), _media(2)
    hidden.show_in_gallery = False
    raw = PostMediaField("media_selection").form_value(
        MediaSelection(attachments=[shown, hidden])
    )

    assert json.loads(raw) == [
        {"id": 1, "show_in_gallery": True},
        {"id": 2, "show_in_gallery": False},
    ]


def test_post_read_omits_media_hidden_from_the_gallery():
    shown, hidden = _media(1), _media(2)
    hidden.show_in_gallery = False
    now = datetime.now(UTC)
    post = Post(id=1, title="Title", content="<p>x</p>", show_gallery=True)
    post.created_at = post.updated_at = now
    post.media_selection = MediaSelection(attachments=[shown, hidden])

    data = PostRead.model_validate(post).model_dump()

    assert [item["id"] for item in data["media"]] == [1]


def test_post_read_names_audio_hidden_from_the_gallery():
    hidden = _media(2, kind="audio")
    hidden.show_in_gallery = False
    hidden.filename = "field-recording.mp3"
    now = datetime.now(UTC)
    post = Post(
        id=1,
        title="Title",
        content=f'<p><audio src="{hidden.url}" controls></audio></p>',
        show_gallery=True,
    )
    post.created_at = post.updated_at = now
    post.media_selection = MediaSelection(attachments=[hidden])

    data = PostRead.model_validate(post).model_dump()

    assert 'data-filename="field-recording.mp3"' in data["content"]
    assert data["media"] == []


def test_post_read_can_hide_gallery_flag():
    now = datetime.now(UTC)
    post = Post(id=1, title="Title", content="<p>x</p>", show_gallery=False)
    post.created_at = post.updated_at = now

    data = PostRead.model_validate(post).model_dump()

    assert data["show_gallery"] is False

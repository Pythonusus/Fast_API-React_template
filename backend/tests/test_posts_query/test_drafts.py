"""Draft posts stay in the admin database and off the public API."""

import asyncio
from types import SimpleNamespace

from sqlalchemy import select
from sqlalchemy.dialects import sqlite
from starlette_admin.types import RequestAction

from app.admin.posts.views import PostAdmin, form_saves_draft
from app.db.posts.crud import get_post
from app.db.posts.models import Post
from app.db.posts.query import published_posts
from app.schemas.posts import PostCreate, PostRead, PostUpdate


def test_public_schemas_omit_the_draft_flag() -> None:
    assert "is_draft" not in PostRead.model_fields
    assert "is_draft" not in PostCreate.model_fields
    assert "is_draft" not in PostUpdate.model_fields


def test_published_posts_adds_the_draft_filter() -> None:
    statement = published_posts(select(Post).where(Post.id == 1))
    sql = str(statement.compile(dialect=sqlite.dialect()))
    assert "is_draft" in sql


class _Result:
    def __init__(self, post: Post | None) -> None:
        self._post = post

    def scalar_one_or_none(self) -> Post | None:
        return self._post


class _Session:
    def __init__(self, post: Post | None) -> None:
        self.post = post
        self.statement = None

    async def execute(self, statement):
        self.statement = statement
        return _Result(self.post)


def test_get_post_queries_only_published_rows() -> None:
    session = _Session(None)
    assert asyncio.run(get_post(session, 4)) is None
    sql = str(session.statement.compile(dialect=sqlite.dialect()))
    assert "is_draft" in sql


def test_form_saves_draft_only_for_the_draft_buttons() -> None:
    assert form_saves_draft({"_save_draft": "1"}) is True
    assert form_saves_draft({"_continue_editing": "draft"}) is True
    assert form_saves_draft({"_continue_editing": ""}) is False
    assert form_saves_draft({}) is False


class _Request:
    def __init__(self, action: RequestAction, form: dict[str, str]) -> None:
        self.state = SimpleNamespace(action=action)
        self._form = form

    async def form(self) -> dict[str, str]:
        return self._form


def _post(*, draft: bool) -> Post:
    return Post(
        title="Later",
        content="<p>Later</p>",
        is_draft=draft,
    )


def test_create_keeps_a_draft_only_when_the_button_says_so() -> None:
    admin = PostAdmin(Post)
    draft = _post(draft=False)
    asyncio.run(
        admin.before_create(
            _Request(RequestAction.CREATE, {"_save_draft": "1"}),
            {},
            draft,
        )
    )
    assert draft.is_draft is True

    published = _post(draft=True)
    asyncio.run(
        admin.before_create(
            _Request(RequestAction.CREATE, {}),
            {},
            published,
        )
    )
    assert published.is_draft is False

    imported = _post(draft=True)
    asyncio.run(
        admin.before_create(
            _Request(RequestAction.IMPORT, {"_save_draft": "1"}),
            {},
            imported,
        )
    )
    assert imported.is_draft is True


def test_editing_a_published_post_cannot_make_it_a_draft() -> None:
    admin = PostAdmin(Post)
    post = _post(draft=False)
    asyncio.run(
        admin.before_edit(
            _Request(RequestAction.EDIT, {"_save_draft": "1"}),
            {},
            post,
        )
    )
    assert post.is_draft is False


def test_editing_a_draft_publishes_unless_the_draft_button_is_used() -> None:
    admin = PostAdmin(Post)
    kept = _post(draft=True)
    asyncio.run(
        admin.before_edit(
            _Request(RequestAction.EDIT, {"_continue_editing": "draft"}),
            {},
            kept,
        )
    )
    assert kept.is_draft is True

    published = _post(draft=True)
    asyncio.run(
        admin.before_edit(
            _Request(RequestAction.EDIT, {}),
            {},
            published,
        )
    )
    assert published.is_draft is False

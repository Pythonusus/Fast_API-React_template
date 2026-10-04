"""
Database CRUD helpers for posts.

These functions only use SQLAlchemy. They do not know about HTTP status
codes or FastAPI. Routes should:

1. Get a session via ``Depends(get_session)``.
2. Call one of the helpers below.
3. Map the ``Post`` ORM row to ``PostRead`` (or raise 404 if missing).

``get_session`` commits on success and rolls back on error, so these
helpers ``flush`` (send SQL, get DB-generated values) but do not ``commit``.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.posts.models import Post
from app.schemas.posts import PostCreate, PostUpdate


async def get_post(session: AsyncSession, post_id: int) -> Post | None:
    """
    Fetch one post by primary key.

    ``session.get`` hits the SQLAlchemy’s in-session cache (identity map) first,
    then the database.
    Returns ``None`` if no row exists — the API layer turns that into 404.
    """
    return await session.get(Post, post_id)


# all args after * are keyword-only and optional because of the default values
async def list_posts(
    session: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> list[Post]:
    """
    Return posts, newest first.

    ``skip`` / ``limit`` are simple offset pagination.
    """
    # Build a SELECT; chain filters/options before execute.
    stmt = (
        select(Post)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    # execute() runs the SQL; scalars().all() unwraps ORM rows from the result.
    # When using session.execute() without scalars() in result we would get
    # a list of SQLAlchemy Row objects, something like [(Post1,), (Post2,), ...]
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create_post(session: AsyncSession, data: PostCreate) -> Post:
    """
    Insert a new post from a validated ``PostCreate`` schema.

    Flow:
    1. ``model_dump()`` turns the Pydantic model into a plain dict of fields.
    2. ``Post(**...)`` builds an ORM instance (not in the DB yet).
    3. ``add`` stages it on the session.
    4. ``flush`` sends INSERT so Postgres assigns ``id`` / timestamps.
    5. ``refresh`` reloads those server defaults onto the Python object.
    """
    post = Post(**data.model_dump())
    session.add(post)
    await session.flush()
    await session.refresh(post)
    return post


async def update_post(
    session: AsyncSession,
    post: Post,
    data: PostUpdate,
) -> Post:
    """
    Apply a partial update from ``PostUpdate`` onto an existing ``Post``.

    ``exclude_unset=True`` keeps only fields the client actually sent, so
    omitted PATCH fields stay unchanged (``None`` defaults are not applied).

    ``onupdate=func.now()`` on ``updated_at`` runs when the ORM sees a change.
    """
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(post, field, value)

    await session.flush()
    await session.refresh(post)
    return post


async def delete_post(session: AsyncSession, post: Post) -> None:
    """
    Delete an existing post row.

    Pass the ORM instance from ``get_post`` (after a 404 check in the route).
    ``flush`` issues DELETE; the request-scoped session commits later.
    """
    await session.delete(post)
    await session.flush()

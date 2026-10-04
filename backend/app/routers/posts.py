"""
HTTP routes for posts CRUD.

Each handler:
1. Gets an async DB session via ``Depends(get_session)``.
2. Calls a helper in ``app.db.posts.crud``.
3. Returns data shaped by ``PostRead`` (or 404 / 204).
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_session
from app.db.posts import crud
from app.db.posts.models import Post
from app.schemas.posts import PostCreate, PostRead, PostUpdate

# prefix is shared by every route below; tags group them in OpenAPI docs.
router = APIRouter(prefix="/api/posts", tags=["posts"])


# response_model automaticaly the SQLAlchemy model returned by the handler
# to the Pydantic model. It also automatically documents the API in docs.
# You can omit the response_model and serialize the response manually
# in the handler, like PostRead.model_validate(post) but you would lose
# the automatic documentation. The response model shhould have
# from_attributes=True config set to let Pydantic build the model from the
# SQLAlchemy model.
@router.get("", response_model=list[PostRead])
async def read_posts(
    # Query means the parameter is passed as a query string parameter'
    # Those after ? in the URL are query parameters.
    # default value makes the parameter optional., so by default
    # this endpoint returns the last 100 posts.
    skip: int = Query(0, ge=0, description="Rows to skip (offset)."),
    limit: int = Query(100, ge=1, le=100, description="Max rows to return."),
    session: AsyncSession = Depends(get_session),
) -> list[Post]:
    """List up to 100 posts, newest first."""
    return await crud.list_posts(session, skip=skip, limit=limit)


@router.get("/{post_id}", response_model=PostRead)
async def read_post(
    post_id: int,
    session: AsyncSession = Depends(get_session),
) -> Post:
    """Get one post by id."""
    post = await crud.get_post(session, post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    return post


# status_code sets the HTTP status code for the response.
# If not set it defaults to 200 OK.
@router.post("", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: PostCreate,
    session: AsyncSession = Depends(get_session),
) -> Post:
    """Create a post from the request body. Returns the created post."""
    return await crud.create_post(session, data)


@router.patch("/{post_id}", response_model=PostRead)
async def update_post(
    post_id: int,
    data: PostUpdate,
    session: AsyncSession = Depends(get_session),
) -> Post:
    """
    Partial update; omitted fields stay unchanged.
    Returns the updated post.
    """
    post = await crud.get_post(session, post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    return await crud.update_post(session, post, data)


# 204 No Content is a successful response with no content.
# Common for DELETE requests.
@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a post. Empty body on success."""
    post = await crud.get_post(session, post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    await crud.delete_post(session, post)

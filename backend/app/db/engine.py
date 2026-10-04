"""
Module for working with the database.

Creates an asynchronous SQLAlchemy engine and a session factory.
All database operations must be asynchronous for maximum performance.

Now two databases are supported: SQLite and PostgreSQL.
SQLite is used for development and testing.
PostgreSQL is used for production.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.settings import settings


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.

    Every model should inherit from this class so SQLAlchemy can track
    table metadata and Alembic can use it for migrations.
    """

    pass


# Async SQLAlchemy engine.
# SQLite has no QueuePool, so skip pool_size / max_overflow for it.
if settings.database_url.startswith("sqlite"):
    engine: AsyncEngine = create_async_engine(
        settings.database_url,
        echo=settings.development,  # Log SQL only in development
    )
else:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.development,  # Log SQL only in development
        pool_pre_ping=True,  # Verify connection before each use
        pool_size=5,  # Connection pool size
        max_overflow=10,  # Extra connections beyond pool_size
    )


# Async session factory: call it to open a new session per request.
async_session_factory = async_sessionmaker(
    bind=engine,  # Engine that provides DB connections for sessions
    class_=AsyncSession,  # Session type (async, not sync Session)
    # Keep attrs readable after commit (no lazy reload)
    # Must have for async SQLAlchemy to work correctly
    expire_on_commit=False,
    # Do not auto-FLUSH pending changes before queries
    # Must have for async SQLAlchemy to work correctly
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async DB session.

    Use via Depends(get_session). The session is closed after the request.

    Example:
        @app.get("/posts")
        async def get_posts(session: AsyncSession = Depends(get_session)):
            result = await session.execute(select(Post))
            return result.scalars().all()
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()  # Commit the transaction if no error occurs
        except Exception:
            # Rollback the transaction if an error occurs
            await session.rollback()
            raise
        finally:
            # Close the session after the request
            await session.close()

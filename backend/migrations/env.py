"""
Alembic migration environment for this async FastAPI app.

After ``alembic init -t async migrations`` so the
async runner is generated), wire this file to the application before the first
revision:

1. Import ``Base`` from ``app.db.engine`` and set
   ``target_metadata = Base.metadata`` so ``alembic revision --autogenerate``
   can diff models against the database.
2. Import every model module (e.g. ``import app.db.posts.models``). Tables are
   only registered on ``Base.metadata`` after their classes are imported;
   ``Base`` alone is not enough.
3. Override ``sqlalchemy.url`` from ``settings.database_url`` instead of the
   placeholder in ``alembic.ini``. Escape ``%`` as ``%%`` so ConfigParser does
   not treat password characters as interpolation.

Run Alembic from ``backend/`` so ``prepend_sys_path = .`` in ``alembic.ini``
makes ``import app`` resolve. Then:

    uv run alembic revision --autogenerate -m "message"
    uv run alembic upgrade head
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

import app.db.posts.models  # noqa: F401  registers all models here
from app.db.engine import Base
from app.settings import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model metadata for 'autogenerate' support.
target_metadata = Base.metadata

# alembic.ini keeps a dummy sqlalchemy.url; the real URL comes from settings.
# Escape % so ConfigParser does not treat it as interpolation.
config.set_main_option(
    "sqlalchemy.url", settings.database_url.replace("%", "%%")
)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with a sync connection bridge."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Create an async engine and apply migrations online.

    Alembic's migration API is synchronous, so the connection is handed to
    ``do_run_migrations`` through ``run_sync``.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

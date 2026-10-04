"""
Backend application settings.

Values load when ``Settings()`` runs at import time.
See ``.env.example`` at the repository root for names and examples.
"""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve repo root from this file: backend/app/settings.py -> parents[2].
# The shared ``.env`` lives next to ``compose.yaml``, not under ``backend/``.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """
    Typed configuration for the backend.

    Loading order (highest priority wins):

    1. Process environment variables (e.g. ``export DATABASE_URL=...`` or
       Docker ``environment:`` / ``env_file:`` injection).
    2. Keys from ``ENV_FILE`` if the file exists (missing file is ignored).
    3. ``Field(default=...)`` on each attribute.

    Field names use snake_case; env keys use UPPER_SNAKE_CASE
    (``database_url`` <-> ``DATABASE_URL``). Env names are case-insensitive.
    """

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,  # load variables from project root .env file
        env_file_encoding="utf-8",  # explicitly set encoding
        case_sensitive=False,  # ignore case sensitivity of env variables
        extra="ignore",  # ignore extra variables in .env file
    )

    app_title: str = Field(
        default="Fast_API-React_template",
        description=(
            "[OPTIONAL] FastAPI title (env: APP_TITLE). "
            "Defaults to Fast_API-React_template."
        ),
    )

    development: bool = Field(
        default=False,
        description=(
            "[OPTIONAL] Development mode (env: DEVELOPMENT). Defaults to false."
        ),
    )

    database_url: str = Field(
        ...,
        description=(
            "[REQUIRED] Async SQLAlchemy URL (env: DATABASE_URL). "
            "Local: sqlite+aiosqlite:///../local.db "
            "Local db is assumed to be located in the root of the project. ",
            "Compose/prod: postgresql+asyncpg://user:pass@db:5432/db_name",
        ),
    )

    timezone: str = Field(
        default="Europe/Moscow",
        description=(
            "[OPTIONAL] IANA timezone for API datetime serialization "
            "(env: TIMEZONE). Defaults to Europe/Moscow."
        ),
    )

    # --- starlette-admin / session auth -------------------------------------

    secret_key: str = Field(
        ...,
        description=(
            "[REQUIRED] Secret used to sign session cookies and admin CSRF "
            "(env: SECRET_KEY). Use a long random string; never commit real "
            "values. Must match SessionMiddleware and Admin(secret_key=...)."
        ),
    )

    admin_username: str = Field(
        ...,
        description=(
            "[REQUIRED] Single admin username for the admin panel "
            "(env: ADMIN_USERNAME)."
        ),
    )

    admin_password_hash: str = Field(
        ...,
        description=(
            "[REQUIRED] bcrypt hash of the admin password "
            "(env: ADMIN_PASSWORD_HASH). Generate with "
            "`uv run python scripts/generate_hash.py` from backend/."
        ),
    )

    admin_title: str = Field(
        default="Admin",
        description=(
            "[OPTIONAL] Browser/nav title for the admin panel "
            "(env: ADMIN_TITLE). Defaults to Admin."
        ),
    )

    admin_url_prefix: str = Field(
        default="/admin",
        description=(
            "[OPTIONAL] URL prefix where the admin is mounted "
            "(env: ADMIN_URL_PREFIX). Defaults to /admin. Prefer a less "
            "guessable path in production."
        ),
    )

    session_max_age: int = Field(
        default=3600,
        description=(
            "[OPTIONAL] Server-side session TTL in seconds when "
            "remember_me is false (env: SESSION_MAX_AGE). Defaults to 3600 "
            "(1 hour)."
        ),
    )

    session_remember_me_max_age: int = Field(
        default=604800,
        description=(
            "[OPTIONAL] Server-side session TTL in seconds when "
            "remember_me is true (env: SESSION_REMEMBER_ME_MAX_AGE). "
            "Also used as the SessionMiddleware cookie max_age upper bound. "
            "Defaults to 604800 (7 days)."
        ),
    )


# Shared instance; import validates config once at startup.
settings = Settings()

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
            "Example: postgresql+asyncpg://user:pass@host:5432/db"
        ),
    )

    timezone: str = Field(
        default="Europe/Moscow",
        description=(
            "[OPTIONAL] IANA timezone for API datetime serialization "
            "(env: TIMEZONE). Defaults to Europe/Moscow."
        ),
    )


# Shared instance; import validates config once at startup.
settings = Settings()

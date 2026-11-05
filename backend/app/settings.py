"""
Backend application settings.

Values load when ``Settings()`` runs at import time.
See ``.env.example`` at the repository root for names and examples.
"""

from pathlib import Path
from typing import ClassVar
from urllib.parse import urlsplit

from pydantic import Field, field_validator
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

    Product defaults are ``ClassVar``s — change them here, not in ``.env``.
    """

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,  # load variables from project root .env file
        env_file_encoding="utf-8",  # explicitly set encoding
        case_sensitive=False,  # ignore case sensitivity of env variables
        extra="ignore",  # ignore extra variables in .env file
    )

    app_title: ClassVar[str] = "Fast_API-React_template"

    # IANA timezone for API datetime serialization.
    timezone: ClassVar[str] = "Europe/Moscow"

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
            "(Local db file assumed at project root). "
            "Compose/prod: postgresql+asyncpg://user:pass@db:5432/db_name "
        ),
    )

    # --- starlette-admin / session auth -------------------------------------

    secret_key: str = Field(
        ...,
        description=(
            "[REQUIRED] Secret used to sign session cookies and admin CSRF "
            "(env: SECRET_KEY). Use a long random string; never commit real "
            "values. Used by SessionMiddleware and Admin(secret_key=...)."
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
            "`uv run python scripts/generate_password_hash.py` "
            "from backend/."
        ),
    )

    # --- S3-compatible object storage (MinIO / Yandex / AWS S3) -------------

    s3_endpoint_url: str = Field(
        default="http://minio:9000",
        description=(
            "[OPTIONAL] Internal S3 API endpoint used by the backend "
            "(env: S3_ENDPOINT_URL). Defaults to the compose service "
            "http://minio:9000. Change it (plus credentials) to switch to "
            "Yandex Object Storage / AWS S3."
        ),
    )

    s3_public_url: str = Field(
        ...,
        description=(
            "[REQUIRED] Public URL of the S3 API as the browser sees it "
            "(env: S3_PUBLIC_URL). A path prefix such as /s3/ is stripped "
            "by Nginx before MinIO. Presigned URLs are signed for the "
            "origin, then the prefix is inserted for the browser."
        ),
    )

    s3_region: str = Field(
        default="ru-central1",
        description=(
            "[OPTIONAL] SigV4 region (env: S3_REGION). "
            "Defaults to ru-central1, Yandex Object Storage in Moscow. "
            "AWS us-east-1 is the other common value. MinIO must use "
            "the same region."
        ),
    )

    @field_validator("s3_public_url")
    @classmethod
    def _public_url_is_absolute(cls, value: str) -> str:
        parts = urlsplit(value.strip())
        if parts.scheme not in ("http", "https") or not parts.netloc:
            raise ValueError("S3_PUBLIC_URL must be an absolute http(s) URL")
        return value.strip()

    s3_access_key: str = Field(
        ...,
        description=(
            "[REQUIRED] S3 access key ID (env: S3_ACCESS_KEY). "
            "Compose maps it to MINIO_ROOT_USER for the MinIO container."
        ),
    )

    s3_secret_key: str = Field(
        ...,
        description=(
            "[REQUIRED] S3 secret access key (env: S3_SECRET_KEY). "
            "Compose maps it to MINIO_ROOT_PASSWORD for the MinIO container."
        ),
    )

    s3_bucket: str = Field(
        ...,
        description=(
            "[REQUIRED] Bucket for post attachments (env: S3_BUCKET). "
            "Created on backend startup if it does not exist."
        ),
    )

    # Browser/nav title for the admin panel.
    admin_title: ClassVar[str] = "Admin"

    # Admin panel mount URL.
    # Keep in sync with frontend/vite.config.ts and nginx.conf proxies.
    # In a real app, change "/admin" to something less obvious (e.g.
    # "/manage-x7k2") to cut bot noise. Not a security control — auth is.
    admin_url_prefix: ClassVar[str] = "/admin"

    # Admin panel default locale.
    admin_default_locale: ClassVar[str] = "ru"

    # Server-side session TTL in seconds when remember_me is false (1 hour).
    session_max_age: ClassVar[int] = 3600

    # Server-side session TTL when remember_me is true (7 days).
    # Also used as the SessionMiddleware cookie max_age upper bound.
    session_remember_me_max_age: ClassVar[int] = 604800

    # Maximum pagination size for the list API responses.
    # That protects the API and the client from huge payloads.
    # Keep this in sync with the frontend's ``POSTS_MAX_PAGE_SIZE``.
    max_pagination_size: ClassVar[int] = 100

    # Max HTML body size for a post (characters). Large enough for rich
    # TinyMCE content; capped to limit abuse. Enforced in Pydantic schemas
    # (API + admin) and a DB check constraint on ``posts.content``.
    post_content_max_length: ClassVar[int] = 100_000

    # Max size of one image, audio, or video uploaded from the post editor.
    # Nginx ``client_max_body_size`` on the API location must stay at least
    # this large, or the proxy rejects the upload before the app sees it.
    media_upload_max_bytes: ClassVar[int] = 32 * 1024 * 1024


# Shared instance; import validates config once at startup.
settings = Settings()

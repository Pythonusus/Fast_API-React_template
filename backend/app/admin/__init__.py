"""
Admin panel initialization.

Creates the Admin instance and wires auth plus model views.

Auth overview (see ``app.admin.auth`` for the full design):

- ``AdminAuthProvider`` — session + bcrypt form login for one
  env-configured admin
- ``secret_key`` — must match FastAPI ``SessionMiddleware`` so
  session cookies verify
- Entity views (e.g. ``PostAdmin``) are registered below; add more
  with ``add_view``
"""

from starlette_admin import I18nConfig
from starlette_admin.contrib.sqla import Admin
from starlette_admin.i18n import SUPPORTED_LOCALES

from app.admin.auth import AdminAuthProvider
from app.admin.posts.views import PostAdmin
from app.db.engine import engine
from app.db.posts.models import Post
from app.settings import settings


def create_admin() -> Admin:
    """
    Create and configure the admin panel.

    Returns:
        Configured Admin instance ready to mount on FastAPI
    """
    # Async SQLAlchemy engine; the admin panel detects async automatically.
    admin = Admin(
        # Async SQLAlchemy engine (session_provider)
        session_provider=engine,
        title=settings.admin_title,
        # Must stay in sync with vite.config.ts and nginx.conf proxies.
        base_url=settings.admin_url_prefix,
        auth_provider=AdminAuthProvider(),
        # Used to sign admin CSRF / flash cookies.
        # Session cookies use the same secret via SessionMiddleware in api.py.
        secret_key=settings.secret_key,
        i18n_config=I18nConfig(
            default_locale=settings.admin_default_locale,
            # optional: navbar language picker
            language_switcher=SUPPORTED_LOCALES,
        ),
    )

    admin.add_view(PostAdmin(Post))

    return admin

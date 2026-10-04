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

from starlette_admin.contrib.sqla import Admin

from app.admin.auth import AdminAuthProvider
from app.admin.posts.views import PostAdmin
from app.db import engine
from app.db.posts.models import Post
from app.settings import settings


def create_admin() -> Admin:
    """
    Create and configure the admin panel.

    Returns:
        Configured Admin instance ready to mount on FastAPI
    """
    # Async SQLAlchemy engine; starlette-admin detects async automatically.
    admin = Admin(
        # Async SQLAlchemy engine (starlette-admin 1.x: session_provider)
        session_provider=engine,
        title=settings.admin_title,
        base_url=settings.admin_url_prefix,  # Obscure URL prefix
        auth_provider=AdminAuthProvider(),
        # Used to sign admin CSRF / flash cookies.
        # Session cookies use the same secret via SessionMiddleware in api.py.
        secret_key=settings.secret_key,
    )

    admin.add_view(PostAdmin(Post))

    return admin

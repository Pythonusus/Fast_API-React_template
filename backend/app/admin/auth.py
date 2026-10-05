"""
Authentication provider for starlette-admin.

==============================================================================
What this is
==============================================================================
Classic **session-based form login** for a **single admin**.

It is NOT JWT, OAuth, or a multi-user DB account system. Credentials live in
environment variables; after a successful login the browser holds a signed
session cookie and every later admin request is checked against that session.

High-level flow::

    Browser                         Server
       |                               |
       |  POST login form              |
       |  username + plain password    |  (use HTTPS in production)
       |------------------------------>|
       |                         validate length
       |                         compare username to env
       |                         bcrypt.checkpw vs stored hash
       |                         write signed session cookie
       |<------------------------------|
       |  Cookie: session=...          |
       |                               |
       |  GET /admin/...               |
       |  Cookie: session=...          |
       |------------------------------>|
       |                         verify cookie signature
       |                         authenticate() + TTL
       |                         allow or redirect to login

starlette-admin 1.x calls three methods on ``AdminAuthProvider``:

- ``login``        — handle the login form submit
- ``authenticate`` — gate every protected admin request; return AdminUser
- ``logout``       — clear the session

Wire-up (see ``app.api`` and ``app.admin``):

- ``SessionMiddleware`` on the FastAPI app with the same ``secret_key``
- ``Admin(..., auth_provider=..., secret_key=...)`` then ``mount_to(app)``

==============================================================================
Transport vs storage (why bcrypt AND HTTPS)
==============================================================================
The login form sends the password as **plain text in the HTTP body**. That is
normal for form auth. Protection splits into two layers:

1. **HTTPS (TLS)** — encrypts the request on the wire so sniffers cannot read
   the password. Without HTTPS, bcrypt does not help during transfer.
2. **bcrypt hash at rest** — env/DB stores only ``ADMIN_PASSWORD_HASH``, never
   the real password. If ``.env`` or a backup leaks, attackers get a slow-to-
   crack hash, not a usable password.

``scripts/generate_password_hash.py`` builds the hash you put in ``.env``.

We do **not** compare the form password to a plain env password on purpose:
a storage leak would equal instant admin access (and password reuse risk).

==============================================================================
Session model
==============================================================================
On success, ``login`` writes to ``request.session`` (signed cookie via
SessionMiddleware — no Redis/server-side session store):

- ``username``       — who logged in
- ``authenticated``  — login succeeded
- ``login_time``     — unix timestamp for server-side TTL
- ``remember_me``    — which TTL to apply later

The password is never stored in the session.

Expiry is enforced twice:

1. Cookie ``max_age`` from SessionMiddleware (browser may drop the cookie).
2. Server-side check in ``authenticate`` using ``login_time`` against
   ``session_max_age`` or ``session_remember_me_max_age``.

The second check exists because starlette-admin has no built-in remember-me
TTL, and cookie lifetime alone can disagree with ``remember_me=False``.

==============================================================================
Security notes baked into this file
==============================================================================
- Always run ``bcrypt.checkpw`` (real hash or ``_DUMMY_HASH``) so timing does
  not reveal whether the username exists.
- Failure message is always Invalid username or password,
  never "wrong password" vs "unknown user".
- Validate passwords via ``app.utils.password_rules`` before bcrypt
  (full policy in production only).
- Sessions without ``login_time`` are rejected and cleared.

For multiple admins later: move credentials to the DB, keep bcrypt + sessions,
replace the env username/hash check with a DB lookup.
"""

import time

import bcrypt
from starlette.requests import Request
from starlette.responses import Response
from starlette_admin.auth import AdminUser, AuthProvider
from starlette_admin.exceptions import FormValidationError, LoginFailed

from app.settings import settings
from app.utils.password_rules import validate_password


def _hash_password(password: str) -> str:
    """Return a bcrypt hash string for ``password`` (UTF-8)."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    """Return True if ``password`` matches ``password_hash``."""
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )


# Precomputed bcrypt hash of a throwaway string.
# When the submitted username does NOT match settings.admin_username we still
# call bcrypt.checkpw against this hash so response time stays close to the
# "user exists" path. That reduces username enumeration via timing.
_DUMMY_HASH = _hash_password("dummy-password-for-timing-protection")


class AdminAuthProvider(AuthProvider):
    """
    Single-admin AuthProvider for starlette-admin 1.x.

    Login checks env credentials (username + bcrypt hash), then stores auth
    state in a signed Starlette session cookie. Later requests only consult
    that session (plus server-side TTL) — the password is not re-checked
    until the next login.

    Enough for one operator. For multiple users, replace the env compare in
    ``login`` with a database lookup; keep hashing and session semantics.
    """

    async def login(
        self,
        username: str,
        password: str,
        remember_me: bool,
        request: Request,
    ) -> Response | None:
        """
        Handle a login form submit.

        ``password`` is the plain-text value from the form body (after HTTPS
        decryption if TLS is used). Hashing happens here for verification
        only; nothing hashes the password in the browser.

        On success the session cookie is populated and ``None`` means "use the
        default redirect" (``next`` query param or admin index). On failure
        a starlette-admin exception is raised and the login page shows an
        error.

        Args:
            username: Username from the form
            password: Plain-text password from the form (not a hash)
            remember_me: If True, use the longer server-side TTL later
            request: HTTP request (provides ``request.session``)

        Returns:
            ``None`` for the default post-login redirect

        Raises:
            FormValidationError: Field-level validation failed (shown inline)
            LoginFailed: Credentials invalid (generic error message)
        """
        # Cheap checks first: bcrypt is deliberately slow (~100ms+), so skip
        # it for inputs that can never be valid. Full composition rules apply
        # in production only (see app.utils.password_rules).
        if not username or len(username) < 3:
            raise FormValidationError(
                {"username": "Username must be at least 3 characters"}
            )

        password_error = validate_password(password)
        if password_error:
            raise FormValidationError({"password": password_error})

        # --- Credential check -------------------------------------------------
        # Username: plain string compare to env. Not constant-time, but the
        # username is not treated as a secret; what matters is always paying
        # the bcrypt cost below so timing does not leak "user exists".
        username_matches = username == settings.admin_username

        # Password: always bcrypt.checkpw. On username miss, verify against
        # _DUMMY_HASH so both branches do similar work.
        # Env holds only a hash (ADMIN_PASSWORD_HASH), never the real password.
        hash_to_check = (
            settings.admin_password_hash if username_matches else _DUMMY_HASH
        )
        password_matches = _verify_password(password, hash_to_check)

        # Both checks already ran → similar timing on success and failure.
        if not (username_matches and password_matches):
            # Single message: do not reveal which field was wrong.
            raise LoginFailed("Invalid username or password")

        # --- Establish session ------------------------------------------------
        # SessionMiddleware signs this dict into a cookie with secret_key.
        # No password here — only identity + TTL metadata.
        # login_time powers the server-side expiry in authenticate();
        # remember_me selects which max_age setting to use there.
        now = int(time.time())
        request.session.update(
            {
                "username": username,
                "authenticated": True,
                "login_time": now,
                "remember_me": remember_me,
            }
        )

        # Cookie max_age itself comes from SessionMiddleware config.
        # Return None so starlette-admin redirects to ``next`` / admin index.
        return None

    async def authenticate(self, request: Request) -> AdminUser | None:
        """
        Decide whether this request may access protected admin routes.

        Called by starlette-admin AuthMiddleware on each request. Does not
        re-verify the password — only the signed session and TTL.

        Args:
            request: HTTP request (must have SessionMiddleware installed)

        Returns:
            ``AdminUser`` when the session is valid, otherwise ``None``
        """
        session = request.session

        # Basic markers from login(). Missing either → treat as logged out.
        username = session.get("username")
        authenticated = session.get("authenticated", False)
        if not (username and authenticated):
            return None

        # Server-side TTL (in addition to cookie max_age).
        # Needed when the cookie still exists but the intended session
        # lifetime (especially remember_me=False) has already passed.
        login_time = session.get("login_time")
        if login_time is None:
            # No timestamp → invalid (forged cookie or leftover from an
            # older app version that did not write login_time).
            session.clear()
            return None

        remember_me = session.get("remember_me", False)
        max_age = (
            settings.session_remember_me_max_age
            if remember_me
            else settings.session_max_age
        )

        if time.time() - login_time > max_age:
            # Expired: drop session so the next hit forces a fresh login.
            session.clear()
            return None

        # Make identity available to ModelView hooks / custom admin routes
        # without reading the session again. starlette-admin also sets
        # request.state.admin_user from the returned AdminUser.
        request.state.user = {
            "username": username,
            # Single-admin setup: anyone authenticated here is admin.
            "is_admin": True,
        }
        return AdminUser(username=username, photo_url=None)

    async def logout(self, request: Request) -> Response | None:
        """
        End the session.

        Clears session data. Return ``None`` so starlette-admin uses the
        default post-logout redirect (admin index / login).

        Args:
            request: HTTP request

        Returns:
            ``None`` for the default redirect
        """
        request.session.clear()
        return None

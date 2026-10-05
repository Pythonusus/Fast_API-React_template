# scripts/generate_password_hash.py
"""
Generate a bcrypt hash for the admin password.

Used by the session-based admin auth in ``app.admin.auth``:

1. Run this script and paste the printed value into ``.env`` as
   ``ADMIN_PASSWORD_HASH=...``
2. At login, the plain password is verified with bcrypt against that hash
3. Only the hash is stored — never the plain password

Production password policy (``app.utils.password_rules``) is enforced when
``DEVELOPMENT`` is false. In development mode the full policy is skipped.

HTTPS still required in production: this hash protects storage, not
the login request on the wire.

Usage:
    uv run python scripts/generate_password_hash.py
    # or: make generate-admin-hash
"""

import sys
from pathlib import Path

# Running as ``python scripts/...`` puts ``scripts/`` on sys.path; add the
# backend root so ``app`` imports resolve.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bcrypt

from app.settings import settings
from app.utils.password_rules import validate_password


def main():
    """Prompt for a password and print an env-ready bcrypt hash."""
    password = input("Enter admin password: ")
    password_error = validate_password(password)
    if password_error:
        mode = "development" if settings.development else "production"
        print(f"Error ({mode} policy): {password_error}")
        raise SystemExit(1)

    # Slow, salted one-way hash (same algo AdminAuthProvider verifies with).
    password_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    print("\n=== Add this to your .env file ===")
    print(f"ADMIN_PASSWORD_HASH={password_hash}")
    if settings.development:
        print(
            "\nNote: DEVELOPMENT=true — production password rules were "
            "not enforced. Re-run with DEVELOPMENT=false before deploying."
        )


if __name__ == "__main__":
    main()

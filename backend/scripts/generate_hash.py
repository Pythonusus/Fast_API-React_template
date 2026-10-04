# scripts/generate_hash.py
"""
Generate a bcrypt hash for the admin password.

Used by the session-based admin auth in ``app.admin.auth``:

1. Run this script and paste the printed value into ``.env`` as
   ``ADMIN_PASSWORD_HASH=...``
2. At login, the plain password from the form is checked with
   ``bcrypt.checkpw`` against ``settings.admin_password_hash``
3. Only the hash is stored — never the plain password — so a leaked
   ``.env`` does not immediately reveal a usable admin password

HTTPS still required in production: this hash protects storage, not
the login request on the wire.

Usage:
    uv run python scripts/generate_hash.py
"""

import bcrypt


def main():
    """Prompt for a password and print an env-ready bcrypt hash."""
    password = input("Enter admin password: ")
    # Slow, salted one-way hash (same algo AdminAuthProvider verifies with).
    password_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    print("\n=== Add this to your .env file ===")
    print(f"ADMIN_PASSWORD_HASH={password_hash}")
    print("\n=== Verification ===")
    print("bcrypt.checkpw(password.encode(), hash.encode()) == True")


if __name__ == "__main__":
    main()

"""
Shared password policy for admin credentials.

Enforced in production only (``settings.development`` is false). In
development the full policy is skipped so local hashes can stay simple.

Policy (production):
- At least 8 characters
- At least one lowercase, one uppercase, one digit, one special
- Only ASCII letters, digits, and the allowed special set
  (no spaces, tabs, emojis, or other Unicode)
- No more than 2 identical characters in a row (``aa`` ok, ``aaa`` not)
"""

import re
import string

PASSWORD_MIN_LENGTH = 8

# Explicit special set — spaces / emoji / other Unicode are not allowed.
_SPECIAL_CHARS = set("!@#$%^&*()-_=+[]{}|;:',.<>?/`~\\\"")
_ALLOWED_CHARS = set(string.ascii_letters + string.digits) | _SPECIAL_CHARS

_ALLOWED_HINT = (
    "Password may only contain letters, digits, and "
    "special characters (!@#$%^&*()-_=+[]{}|;:'\",.<>?/`~\\); "
    "spaces, emojis, and other characters are not allowed"
)

# No more than 2 identical characters in a row (aa ok, aaa not).
_REPEAT_RE = re.compile(r"(.)\1{2,}")


def _should_enforce(enforce: bool | None) -> bool:
    """Resolve whether full policy applies (default: not development)."""
    if enforce is not None:
        return enforce
    from app.settings import settings

    return not settings.development


def _production_errors(password: str) -> list[str]:
    """Collect production policy violations for ``password``."""
    errors: list[str] = []

    if any(ch not in _ALLOWED_CHARS for ch in password):
        # Allowlist failure is decisive — return as a single message later.
        return ["__allowed__"]

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"at least {PASSWORD_MIN_LENGTH} characters")

    if not any(ch.islower() for ch in password):
        errors.append("a lowercase letter")
    if not any(ch.isupper() for ch in password):
        errors.append("an uppercase letter")
    if not any(ch.isdigit() for ch in password):
        errors.append("a digit")
    if not any(ch in _SPECIAL_CHARS for ch in password):
        errors.append("a special character (e.g. !@#$%)")

    if _REPEAT_RE.search(password):
        errors.append("at most 2 identical characters in a row")

    return errors


def _format_errors(errors: list[str]) -> str:
    """Turn requirement fragments into one error string."""
    if errors == ["__allowed__"]:
        return _ALLOWED_HINT
    if len(errors) == 1 and errors[0].startswith("at least"):
        return f"Password must be {errors[0]}"
    if len(errors) == 1 and errors[0].startswith("at most"):
        return f"Password must have {errors[0]}"
    if len(errors) == 1:
        return f"Password must include {errors[0]}"
    return "Password must include " + "; ".join(errors)


def validate_password(
    password: str,
    *,
    enforce: bool | None = None,
) -> str | None:
    """
    Validate ``password`` against the shared policy.

    Args:
        password: Plain-text password to check
        enforce: If True, always apply production rules. If False, skip
            them. If None, enforce when ``settings.development`` is false.

    Returns:
        ``None`` if valid, otherwise a human-readable error string.
    """
    if not password:
        return "Password is required"

    if not _should_enforce(enforce):
        return None

    errors = _production_errors(password)
    if not errors:
        return None
    return _format_errors(errors)

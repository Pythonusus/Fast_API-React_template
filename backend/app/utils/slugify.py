"""
URL slug helpers.
"""

import re


def slugify(value: str) -> str:
    """
    Build a URL slug: lowercase, hyphen-separated, max 255 chars.

    Example:
    ``"Getting started with FastAPI!"`` -> ``"getting-started-with-fastapi"``.
    """
    value = value.strip().lower()
    value = re.sub(r"[\s_]+", "-", value)
    # Keep letters/digits (including non-ASCII, e.g. Cyrillic) and hyphens.
    value = re.sub(r"[^\w-]", "", value, flags=re.UNICODE)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value[:255]

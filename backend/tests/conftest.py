"""This module contains project wide test fixtures."""

import os
from typing import Generator

import pytest
from fastapi.testclient import TestClient

# S3 settings are required, but tests never talk to a real S3 server.
# Set before importing the app because Settings() is created on import.
os.environ.setdefault("S3_ACCESS_KEY", "test-access-key")
os.environ.setdefault("S3_SECRET_KEY", "test-secret-key")
os.environ.setdefault("S3_BUCKET", "test-bucket")
os.environ.setdefault("S3_PUBLIC_URL", "http://localhost:8100/s3/")

from app.api import app  # noqa: E402


@pytest.fixture
def client(monkeypatch) -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""

    # Startup creates the S3 bucket; skip it, no MinIO in tests.
    monkeypatch.setattr("app.api.ensure_bucket", lambda: None)

    with TestClient(app) as c:
        yield c

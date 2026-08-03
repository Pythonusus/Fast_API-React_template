"""This module contains project wide test fixtures."""

from typing import Generator

import pytest
from fastapi.testclient import TestClient

from app.api import app


@pytest.fixture
def client(monkeypatch) -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""

    with TestClient(app) as c:
        yield c

"""
Main API module for backend application.

Contains FastAPI application and API endpoints.
"""

from fastapi import FastAPI

import app.settings as settings

app = FastAPI(title=settings.APP_TITLE)


@app.get("/api/health")
def health():
    return {
        "status_code": 200,
        "message": f"{settings.APP_TITLE} is up and running",
    }


@app.get("/api/hello")
def hello():
    return {
        "message": "Hello, World!",
    }

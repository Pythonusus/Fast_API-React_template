"""
Main API module for backend application.

Contains FastAPI application and API endpoints.
"""

from fastapi import FastAPI

import app.settings as settings
from schemas.api import MirrorRequest

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


@app.get("/api/about")
def about():
    return {
        "message": "This is the about page",
    }


@app.post("/api/mirror")
def mirror(request: MirrorRequest):
    return {
        "message": request.message,
    }

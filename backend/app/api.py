"""
Main API module for backend application.

Contains FastAPI application and API endpoints.
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.schemas.api import MirrorRequest
from app.settings import settings

# FastAPI application instance.
# The core of the backend service.
app = FastAPI(title=settings.app_title)


# Liveness check. Callers (load balancers, monitors, the frontend) hit
# GET /api/health to confirm the process is up and ready to serve requests.
# It does not check the database or other dependencies.
@app.get("/api/health")
def health():
    # The simplest response as python dict.
    # Dict, list, tuple, set, str, int, float, None, Bool, Pydantic models
    # are automatically converted to a JSON response by FastAPI with
    # status code 200 by default.
    return {"message": f"{settings.app_title} is up and running"}


@app.get("/api/hello")
def hello():
    # Explicit JSONResponse: same format as returning a dict, but you control
    # status code, headers, cookies, etc. ``content`` may be a dict;
    # JSONResponse serializes it (json.dumps). ``media_type`` defaults to
    # application/json.
    #
    # There are other response classes like HTMLResponse, FileResponse,
    # RedirectResponse, StreamingResponse, etc.
    # See https://fastapi.tiangolo.com/advanced/custom-response/#available-responses
    return JSONResponse(
        content={"message": "Hello, World!"},
        status_code=200,
        headers={"X-Custom-Header": "custom_value"},
    )


@app.get("/api/about")
def about():
    return {"message": "This is the about page"}


@app.post("/api/mirror")
# If request is not a MirrorRequest, FastAPI will return
# a 422 Unprocessable Entity error. The mirror function will not run.
# Extra unknown fields are ignored by default (can be changed in schema).
def mirror(request: MirrorRequest):
    return {
        "message": request.message,
    }

"""
Main API module for backend application.

Contains FastAPI application and API endpoints.
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.admin import create_admin
from app.routers.posts import router as posts_router
from app.schemas.api import MirrorRequest
from app.settings import settings

# FastAPI application instance.
# The core of the backend service.
app = FastAPI(title=settings.app_title)

# Signed session cookies for starlette-admin auth (see app.admin.auth).
# Must use the same secret_key as Admin(...). Cookie max_age is the longer
# remember-me bound; shorter sessions still expire via server-side TTL in
# AdminAuthProvider.authenticate(). Parent middleware wraps mounted apps,
# so /admin sees request.session.
# Cookies in starlette-admin are http-only by default.
# JavaScript cannot read the cookie via document.cookie;
# https_only=False in development so local HTTP login works; in production
# the Secure flag is set so the cookie is HTTPS-only.
# same_site="lax": browser sends the cookie on same-site requests and on
# top-level GET navigations from other sites (e.g. clicking a link to /admin),
# but not on cross-site POSTs/embeds — reduces CSRF while still
# allowing normal inbound links.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    max_age=settings.session_remember_me_max_age,
    same_site="lax",
    https_only=not settings.development,
)

# Feature routers: each module owns its own APIRouter and is mounted here.
app.include_router(posts_router)

# Mount starlette-admin under settings.admin_url_prefix (default /admin).
create_admin().mount_to(app)


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

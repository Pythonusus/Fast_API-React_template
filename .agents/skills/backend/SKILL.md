---
name: backend
description: >-
  Work in this repository's FastAPI backend. Use whenever the user adds or
  changes an API route, SQLAlchemy model, CRUD helper, Pydantic schema,
  fastapi-filter, Alembic migration, starlette-admin view, S3 upload, backend
  setting, or pytest under backend/. Also use when they say endpoint, router,
  database, admin panel, or posts API, even if they do not say "backend".
---

# Backend

Copy the posts feature. Do not invent a new layout.

Public writes for posts exist on the router but are unused. Creating and editing posts goes through the admin panel. New public mutations need an explicit ask.

## Layout

```
backend/
  main.py                      uvicorn on 0.0.0.0:8080
  app/api.py                   app, middleware, include_router, mount admin
  app/settings.py              Settings(); import the shared ``settings``
  app/storage.py               boto3 helpers (MinIO / S3)
  app/db/engine.py             Base, engine, get_session
  app/db/<entity>/
    models.py                  SQLAlchemy models
    query.py                   fastapi-filter Filter, when the list is filtered
    crud.py                    session in, ORM out; no HTTP
  app/schemas/<entity>.py      request and response models
  app/routers/<entity>.py      APIRouter; HTTP only
  app/admin/<entity>/views.py  starlette-admin ModelView
  migrations/                  Alembic (async)
  tests/test_endpoints/        TestClient tests
  tests/test_<area>/           unit tests with no HTTP
```

Mount a new router in `app/api.py` with `app.include_router`. Prefix public routes with `/api/<name>` and set `tags`.

Import every new model module in `migrations/env.py` next to `import app.db.posts.models`. Autogenerate only sees models that were imported.

## Request path

1. The route depends on `get_session` from `app.db.engine`.
2. The route calls `app.db.<entity>.crud`. It does not build SQL.
3. `response_model` is the Pydantic read schema. `from_attributes=True` is set on that schema so FastAPI can build it from the ORM object.
4. Missing rows raise `HTTPException(status_code=404)` in the route. CRUD returns `None`.

`get_session` commits after the request succeeds and rolls back on error. CRUD calls `flush` and `refresh`, not `commit`.

Exception: delete storage after the row is committed. `delete_post` returns object keys; the route `await session.commit()` and then `await asyncio.to_thread(delete_objects, keys)`. boto3 is blocking. Never call it directly from an async function.

## Models, schemas, filters

Models inherit `Base` from `app.db.engine`. Use `Mapped` and `mapped_column`. Timestamps are `DateTime(timezone=True)` with `server_default=func.now()`. Relationships on async sessions use `lazy="selectin"`. Empty strings are allowed by the database; length and non-empty rules live in Pydantic and, for admin, in the view's `validate`.

Schemas live in `app/schemas/<entity>.py`.

- Create: required fields, `str_strip_whitespace=True`.
- Update: same fields redeclared with `default=None`. CRUD applies `model_dump(exclude_unset=True)`.
- Read: `from_attributes=True`. Serialize datetimes with `ZoneInfo(settings.timezone)` the way `PostRead` does. Stored values stay UTC.

List filters are a `Filter` subclass in `query.py`, applied with `FilterDepends`. `list_*` and `count_*` both call `post_filter.filter` so `total` matches the page. Default order is `["-created_at"]`. Pagination query params are `skip` (`ge=0`) and `limit` (`ge=1`, `le=settings.max_pagination_size`).

## Admin

Staff editing is a `ModelView` in `app/admin/<entity>/views.py`, registered with `admin.add_view` in `app/admin/__init__.py`. Follow the numbered steps at the top of `app/admin/posts/views.py`. Auth and `SessionMiddleware` are already shared. Admin does not use the API schemas unless the view calls them.

`admin_url_prefix` is `/admin`. If it changes, update `frontend/vite.config.ts` and the nginx proxy too.

## Settings and storage

Add a product constant as a `ClassVar` on `Settings` (pagination cap, content length, upload size). Add a deploy-time value as a `Field` so it loads from the environment. The file is the repo-root `.env`, not `backend/.env`. Do not commit real secrets.

Object bytes go through `app/storage.py`. Public URLs use `public_object_url`. The bucket is created on startup in the FastAPI lifespan.

## Migrations and checks

From the repo root:

```bash
make create-migration m="what changed"
make migrate
make lint-backend
make format-backend
make test-backend
```

`create-migration` runs Alembic autogenerate from `backend/`. Read the generated file before `make migrate`. Ruff line length is 80.

## Tests

HTTP tests use the `client` fixture in `backend/tests/conftest.py` (`TestClient`). It stubs `ensure_bucket`. Set required S3 env vars before importing the app, as that fixture does. Filter and schema tests that do not need the app go in `backend/tests/test_<area>/` and import the unit directly.

`make test-backend` sets `DEVELOPMENT=true`.

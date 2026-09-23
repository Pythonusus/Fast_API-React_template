<div align="center">

# Fast_API-React_template

### CI/CD status:
[![Actions Status](https://github.com/Pythonusus/Fast_API-React_template/actions/workflows/github-ci.yaml/badge.svg)](https://github.com/Pythonusus/Fast_API-React_template/actions)

</div>

## 🔍 Table of content

- [About](#about)
- [Frontend](#frontend)
- [Backend](#backend)
- [Docker](#docker)
- [Nginx](#nginx)
- [Other stuff](#other)
- [Env variables](#environment)
- [Launching in dev mode](#dev-mode)
- [Deploy](#deploy)
- [License](#license)
- [Author](#author)

<a name = "about"></a>
## 📋 About

**Opinionated template for FastAPI backend and React frontend fullstack project.**

### Built with:
- FastAPI - backend
- React - frontend
- Tailwindcss - styling
- Radix-UI - react component primitives
- Validator - frontend string validation and normalization
- PostgreSQL - database
- SQLAlchemy - ORM
- asyncpg - async PostgreSQL driver
- Alembic - migrations
- Pydantic - data validation and settings management
- Nginx - reverse proxy and fast static file delivery
- Docker Compose - containerization
- uv - backend package manager
- Ruff - backend linter and formatter
- Prettier/ESLint/Stylelint - frontend linting and formatting
- Vite - frontend dev server and proxy
- pytest - tests


### 💡 Main features of your project

- **Big feature 1**:
  - Sub feature 1 - description
  - Sub feature 2 - description
- **Feature 2** - description
- **Feature 3** - description

<a name = "frontend"></a>
## 🎨 Frontend

React 19 + React Router 8 (framework mode) + Vite 8 + Radix Themes + next-themes.

**Rendering model:** SSG for the page shell, CSR for dynamic data. Runtime SSR is off (`ssr: false` in `react-router.config.ts`). Public routes are prerendered to static HTML at build time; after hydration, routes load backend data in the browser via `useEffect`. If the backend is down, pages show local fallback/error UI instead of failing the whole app.

### How the pieces work

**Routing.** Routes are registered explicitly in `app/routes.ts` (not auto-discovered from the folder). Today: `/` → `home.tsx`, `/about` → `about.tsx`, `*` → `404.tsx`. Keep UI and data-loading inside each route module; keep `routes.ts` declarations-only.

**Root shell.** `Layout` in `root.tsx` owns `<html>` / `<head>` / `<body>`, Radix + next-themes providers, header, and footer. `App` only renders `<Outlet />` for the matched child route. Conventional export names (`Layout`, `ErrorBoundary`, `Outlet`, `meta`) must stay exact — React Router discovers them by name.

**API calls.** Helpers in `app/api/` use relative URLs like `/api/hello`. In development, Vite’s `server.proxy` forwards them to `localhost:8000`. In production, Nginx reverse-proxies `/api/*`. On failure, throw with shared copy from `common-texts/errors.ts`; routes/hooks catch and show a soft error in the UI.

**Types & shared text.** Put cross-module API shapes in `app/types/`. Colocate props/local state next to the one file that uses them. Add strings to `common-texts/` only when they appear in more than one place.

**Styling & theme.** Prefer Radix Themes components/props. Custom CSS lives next to the component or under `styles/` (global resets, light/dark token overrides). Theme toggle uses CSS to pick icons so prerendered HTML does not flash the wrong icon.

**Errors.** Unknown URLs → splat `404.tsx`. Thrown render errors → root `ErrorBoundary` (still inside `Layout`, so header/footer stay visible). Soft API failures stay local to the page/hook.

**Config.** Copy `frontend/.env.example.frontend` → `frontend/.env`. Only `VITE_*` keys are exposed to the client — never put secrets there.

### Naming conventions

| Entity | Convention | Examples |
|------|------------|----------|
| Folders & files | kebab-case | `home-page-cards/`, `use-mirror-message.ts`, `example-api.ts` |
| Component folders | kebab-case dir + `index.tsx`; colocated CSS named after the folder | `components/header/index.tsx`, `header.css` |
| Route modules | short kebab/lowercase file under `app/routes/` | `home.tsx`, `about.tsx`, `404.tsx` |
| React components | PascalCase exports | `Header`, `HomePageCards`, `AboutRoute` |
| Hooks | `use` + camelCase | `useMirrorMessage` |
| API helpers | `fetch` + camelCase | `fetchHello`, `fetchMirror` |
| Shared constants / error strings | SCREAMING_SNAKE_CASE | `BACKEND_LOAD_FAILED`, `HTML_LANG` |
| Types | PascalCase | `TextResponse` |
| CSS classes | kebab-case (often `app-` prefix for shell UI) | `app-header`, `app-shell` |
| Env keys (client) | `VITE_` prefix | `VITE_HTML_LANG` |

### Step-by-step: adding a new page

Example: a public `/products` page that loads data from the backend after hydration.

1. **Create the route module** — `app/routes/products.tsx`
   - Export `meta` (title/description; name must be `meta`).
   - Default-export the page component.
   - Build UI with Radix (`Section`, `Heading`, `Text`, `Card`, …).

2. **Register the route** — in `app/routes.ts`, add before the `*` splat:
   ```ts
   {
     path: "products",
     file: "routes/products.tsx",
   },
   ```

3. **Prerender the shell (optional)** — in `react-router.config.ts`, add `"/products"` to `prerender` for public marketing/content pages whose shell is known at build time. Skip auth-only, personalized, or parameterized routes. Do not prerender the 404 splat.

4. **API helper (if needed)** — add a typed function in `app/api/` with a relative `/api/...` URL; put shared response types in `app/types/`; reuse `fetchMessageError` / shared error strings.

5. **Styles / shared components (optional)** — colocate CSS under `app/components/<name>/`, or put page-only rules in `app/styles/components/`. Prefer Radix props first. Put reusable UI in `app/components/`.

6. **Shared strings** — if the same copy is used elsewhere, add it to `app/common-texts/`; otherwise leave it inline.

<a name = "quick-start"></a>
## 🚀 Quick Start

### Prerequisites

- curl - command-line tool for transferring data using URLs
- make - for easy custom shortcuts
- git - for fetching the source code
- uv - python package manager
- docker/compose - for running app using docker and compose

### Running the app

1. **Install prerequisites:**

2. **Clone project repo:**
```bash
git clone https://github.com/Pythonusus/Fast_API-React_template.git
cd Fast_API-React_template
```

3. **Set environment variables in .env (see Env variables section and .env.example file):**

4. **Run the app using Docker compose:**
```bash
make docker-start
```

<a name = "environment"></a>
## 🔧 Env variables

Also see `.env.example` in project root.

| Variable | Description | Required | Default/example value |
|------------|----------|----------|------------------------|
| `DEVELOPMENT` | Enables development mode in application. | No | `false` |
| `DATABASE_URL` | Async SQLAlchemy database URL for backend. Must match postgres settings below. | Yes | `postgresql+asyncpg://POSTGRES_USER:POSTGRES_PASSWORD@db:5432/POSTGRES_DB_NAME` |
| `PORT` | Host port mapped to frontend container port `8080`. | No | `8100` |
| `POSTGRES_DB` | Database name created by postgres container on first init. | Yes | `your_database_name` |
| `POSTGRES_USER` | Postgres username for container initialization and healthcheck. | Yes | `your_username` |
| `POSTGRES_PASSWORD` | Postgres password for container initialization. | Yes | `your_super_secret_password` |

<a name = "vps-deploy-vars"></a>
## 🚀 VPS deploy vars

Set these as **GitHub repository secrets**.
The workflow `.github/workflows/vps-deploy.yaml` generates `.env` on the VPS from these secrets during each deploy.

| Secret | Description | Required | Example/default |
|------------|----------|----------|------------------|
| `SERVER_HOST` | VPS hostname or IP for SSH connection. | Yes | `203.0.113.10` |
| `SERVER_USER` | SSH username on VPS. | Yes | `deploy` |
| `SSH_PRIVATE_KEY` | Private key used by `appleboy/ssh-action`. | Yes | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PASSPHRASE` | Passphrase for encrypted SSH private key. | Yes (if key is encrypted) | `your_passphrase` |
| `PROJECT_NAME` | Project directory under `$HOME/projects/` on VPS. | Yes | `fast-api-react-template` |
| `DATABASE_URL` | Async SQLAlchemy DB URL used by backend. | Yes | `postgresql+asyncpg://POSTGRES_USER:POSTGRES_PASSWORD@db:5432/POSTGRES_DB_NAME` |
| `POSTGRES_DB` | Postgres database name for container initialization. | Yes | `your_database_name` |
| `POSTGRES_USER` | Postgres username for initialization and healthcheck. | Yes | `your_username` |
| `POSTGRES_PASSWORD` | Postgres password for container initialization. | Yes | `your_super_secret_password` |
| `PORT` | Host port mapped to frontend container port `8080`. | No | `8100` |
| `DEVELOPMENT` | Enables development mode in application. | No | `false` |


<a id="license"></a>
## ⚖️ License

This project is licensed under the Petr Malafeev Non-Commercial Network Copyleft License v1.0 (RU/EN) - see the LICENSE file for details.

<a name = "author"></a>
## ✍️ Author

- https://github.com/Pythonusus
- https://t.me/Petr_Malafeev
- malafeev.pa@gmail.com

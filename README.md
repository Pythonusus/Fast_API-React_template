<div align="center">

# Fast_API-React_template

### CI/CD status:
[![Actions Status](https://github.com/Pythonusus/Fast_API-React_template/actions/workflows/github-ci.yaml/badge.svg)](https://github.com/Pythonusus/Fast_API-React_template/actions)

</div>

## 🔍 Table of content

- [About](#about)
- [Quick Start](#quick-start)
- [Env variables](#environment)
- [VPS deploy vars](#vps-deploy-vars)
- [License](#license)
- [Author](#author)

<a name = "about"></a>
## 📋 About

**Simple template for FastAPI backend and React frontend fullstack project.**

### Built with:
- FastAPI - async backend
- React - frontend
- PostgreSQL - database
- SQLAlchemy - async ORM
- asyncpg - async PostgreSQL driver
- Alembic - migrations
- Pydantic - data validation and settings management
- Nginx - reverse proxy and fast static file delivery
- Docker Compose - containerization
- uv - backend package manager
- Ruff - backend linter and formatter
- Prettier/ESLint - frontend linter and formatter
- Vite - frontend dev server and proxy
- pytest - tests


### 💡 Main features of your project

- **Big feature 1**:
  - Sub feature 1 - description
  - Sub feature 2 - description
- **Feature 2** - description
- **Feature 3** - description

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

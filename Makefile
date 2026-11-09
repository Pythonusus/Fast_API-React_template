# All commands are assumed to be run from the root of the project

.DEFAULT_GOAL := help

# Show all available make commands
help:
	@echo "Available commands:"
	@echo ""
	@echo "COMMON:"
	@echo "  make pre-commit-install   Install pre-commit hooks"
	@echo "  make pre-commit           Run pre-commit hooks on all files"
	@echo ""
	@echo "BACKEND:"
	@echo "  make install-backend-dev      Install backend prod+dev dependencies"
	@echo "  make install-backend-prod     Install backend prod dependencies"
	@echo "  make generate-password-hash      Generate a new hash for the admin password"
	@echo "  make lint-backend             Run backend lint checks"
	@echo "  make fix-backend              Auto-fix backend lint issues"
	@echo "  make format-backend           Format backend code"
	@echo "  make test-backend             Run backend tests"
	@echo "  make test-backend-coverage    Run backend tests with coverage"
	@echo "  make create-migration m=\"msg\" Create alembic migration"
	@echo "  make migrate                  Apply all migrations"
	@echo "  make start-backend            Start backend dev server"
	@echo ""
	@echo "FRONTEND:"
	@echo "  make install-frontend     Install frontend dependencies"
	@echo "  make build-frontend       Build frontend for production"
	@echo "  make lint-frontend        Run frontend lint checks"
	@echo "  make fix-frontend         Auto-fix frontend lint issues"
	@echo "  make start-frontend       Start frontend dev server"
	@echo ""
	@echo "DOCKER:"
	@echo "  make docker-build         Build all services"
	@echo "  make docker-start         Start all services (app on \$${PORT:-8100})"
	@echo "  make docker-stop          Stop all services"
	@echo "  make docker-down          Stop and remove all services"
	@echo "  make docker-dev           Start dev stack with live reload (http://localhost:5173)"
	@echo "  make docker-dev-down      Stop the dev stack"
	@echo "  make docker-shell-frontend  Shell in the frontend container"
	@echo "  make docker-shell-backend   Shell in the backend container"
	@echo "  make docker-shell-db        Shell in the Postgres container"
	@echo "  make docker-shell-minio     Shell in the MinIO container"
	@echo ""
	@echo "  MinIO console is on the host loopback only: http://127.0.0.1:9001"
	@echo "  Login is S3_ACCESS_KEY / S3_SECRET_KEY. On a VPS, tunnel it:"
	@echo "  ssh -N -L 9001:127.0.0.1:9001 user@your-vps"

# ===== COMMON =====

# Install pre-commit hooks
pre-commit-install:
	cd backend && uv run pre-commit install

# Run pre-commit hooks
pre-commit:
	cd backend && uv run pre-commit run --all-files

# Generate a new hash for the admin password
generate-password-hash:
	cd backend && uv run python scripts/generate_password_hash.py

# ===== BACKEND =====

# Install prod and dev dependencies using uv package manager
install-backend-dev:
	cd backend && uv sync

# Install prod dependencies using uv package manager
install-backend-prod:
	cd backend && uv sync --no-dev

# Run ruff linter on backend app with config from pyproject.toml
lint-backend:
	cd backend && uv run ruff check --config pyproject.toml .

# Fix fixable backend app lint violations with config from pyproject.toml
fix-backend:
	cd backend && uv run ruff check --config pyproject.toml --fix .

# Format backend
format-backend:
	cd backend && uv run ruff format .

# Run pytest on backend app with verbose test output and showing all prints.
test-backend:
	cd backend && DEVELOPMENT=true uv run pytest -v -s

# Run pytest on backend app with coverage report. Generate html and xml reports.
# Also shows terminal report. No report is generated if tests fail.
test-backend-coverage:
	cd backend && DEVELOPMENT=true uv run pytest -s \
		--cov=app \
		--cov-config=pyproject.toml \
		--cov-report=html \
		--cov-report=xml \
		--cov-report=term \
		--no-cov-on-fail

# Create a new migration
# Usage: make create-migration m="Add new column to table"
create-migration:
	cd backend && uv run alembic revision --autogenerate -m "$(m)"

# Apply all pending migrations
migrate:
	cd backend && uv run alembic upgrade head

# Start backend server in dev mode.
# PYTHONPATH is needed because fastapi cli doesn't add the current directory to the PYTHONPATH automatically.
# In production backend is ran in Docker
start-backend:
	cd backend && PYTHONPATH=. uv run fastapi dev app/api.py

# ===== FRONTEND =====

# Install dev and prod dependencies
install-frontend:
	cd frontend && npm ci

# Build frontend for production
build-frontend:
	cd frontend && npm run build

# Lint frontend code using eslint and prettier
lint-frontend:
	cd frontend && npm run lint

# Fix linting issues in frontend code
fix-frontend:
	cd frontend && npm run lint:fix

# Start frontend in development mode
# In production frontend is ran in Docker
start-frontend:
	cd frontend && npm run dev

# ===== DOCKER =====

# Build all services
docker-build:
	docker compose build

# Start all services
docker-start:
	docker compose up

# Stop all services
docker-stop:
	docker compose stop

# Stop and remove all services
docker-down:
	docker compose down

# Open a shell in the frontend container
# Using sh instead of bash because alpine doesn't have bash by default
docker-shell-frontend:
	docker compose exec frontend sh

# Open a shell in the backend container
# Using sh instead of bash because alpine doesn't have bash by default
docker-shell-backend:
	docker compose exec backend sh

# Open a shell in the db container
# Using sh instead of bash because alpine doesn't have bash by default
docker-shell-db:
	docker compose exec db sh

# Open a shell in the minio container
# Using sh instead of bash because alpine doesn't have bash by default
docker-shell-minio:
	docker compose exec minio sh

# Dev stack: Vite + fastapi dev, source bind-mounted. See compose.dev.yaml.
docker-dev:
	HOST_UID=$$(id -u) HOST_GID=$$(id -g) docker compose -f compose.yaml -f compose.dev.yaml up --build

# Stop the dev stack. Named volumes (db, minio) stay.
docker-dev-down:
	docker compose -f compose.yaml -f compose.dev.yaml down

.PHONY: help pre-commit-install pre-commit \
	      generate-password-hash \
	      install-backend-dev install-backend-prod \
	      lint-backend fix-backend format-backend \
	      test-backend test-backend-coverage \
	      create-migration migrate start-backend \
	      install-frontend build-frontend \
	      lint-frontend fix-frontend start-frontend \
	      docker-build docker-start docker-stop docker-down \
	      docker-shell-frontend docker-shell-backend \
	      docker-shell-db docker-shell-minio \
	      docker-dev docker-dev-down

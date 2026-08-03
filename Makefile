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
	@echo "  make docker-start         Start all services"
	@echo "  make docker-stop          Stop all services"
	@echo "  make docker-down          Stop and remove all services"

# ===== COMMON =====

# Install pre-commit hooks
pre-commit-install:
	uv run pre-commit install

# Run pre-commit hooks
pre-commit:
	uv run pre-commit run --all-files

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

.PHONY: help pre-commit-install pre-commit \
	      install-backend-dev install-backend-prod \
	      lint-backend fix-backend format-backend \
	      test-backend test-backend-coverage \
	      create-migration migrate start-backend \
	      install-frontend build-frontend \
	      lint-frontend fix-frontend start-frontend \
	      docker-build docker-start docker-stop docker-down

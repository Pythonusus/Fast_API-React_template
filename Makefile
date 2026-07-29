# Install pre-commit hooks
pre-commit-install:
	uv run pre-commit install

# Run pre-commit hooks
pre-commit:
	uv run pre-commit run --all-files

# Install prod and dev dependencies using uv package manager
install-dev:
	uv sync

# Install prod dependencies using uv package manager
install:
	uv sync --no-dev

# Run ruff linter on backend app with config from pyproject.toml
lint:
	uv run ruff check --config pyproject.toml .

# Format app using ruff with config from pyproject.toml
format:
	uv run ruff check --config pyproject.toml --fix .

# Run tests with verbose test output and showing all prints.
test:
	uv run pytest -v -s

# Run tests with coverage report. Generate html and xml reports.
# Also shows terminal report. No report is generated if tests fail.
test-with-coverage:
	uv run pytest -s \
		--cov=app \
		--cov-config=pyproject.toml \
		--cov-report=html \
		--cov-report=xml \
		--cov-report=term \
		--no-cov-on-fail

# Start app
start:
	uv run python -m app.main

.PHONY: pre-commit-install pre-commit \
        install-dev install \
        lint format \
        test test-with-coverage \
        start

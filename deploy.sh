#!/bin/bash

# Exit on error, undefined variable, or pipeline failure
set -euo pipefail

PORT="${PORT:-8100}"

# Logging functions
log() { echo "[$(date +'%H:%M:%S')] $1"; }
error() { echo "❌ $1"; exit 1; }
info() { echo "ℹ️ $1"; }

# Check if Docker is installed on host
command -v docker >/dev/null 2>&1 || error "Docker is not installed"

# Check if Docker Compose plugin is installed and usable
docker compose version >/dev/null 2>&1 || error "Docker Compose is not installed"

# Starting deploy
log "🚀 Deploy"

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
COMMIT_AUTHOR=$(git log -1 --pretty=%an)

info "Commit: ${COMMIT_HASH}"
info "Author: ${COMMIT_AUTHOR}"
info "Message: ${COMMIT_MESSAGE}"

# Build and recreate services from compose.yaml.
# --remove-orphans also removes containers from this project that are no longer defined.
log "🚧 Building and starting services from compose.yaml..."
docker compose -f compose.yaml up -d --build --remove-orphans

log "🏥 Healthcheck on port ${PORT} and backend /api/health endpoint..."
for i in $(seq 1 30); do

    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}" || true)
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/api/health" || true)

    case "${FRONTEND_STATUS}" in
        200|301|302) FRONTEND_OK=true ;;
        *) FRONTEND_OK=false ;;
    esac

    if [ "${FRONTEND_OK}" = "true" ] && [ "${BACKEND_STATUS}" = "200" ]; then
        log "✅ Frontend is reachable and backend /api/health is healthy"
        break
    fi

    [ "$i" -eq 30 ] && error "Healthcheck failed (frontend: ${FRONTEND_STATUS}, backend /api/health: ${BACKEND_STATUS})"

    sleep 1
done

log "🧹 Cleaning up old images..."
docker image prune -f

log "🎉 Deployment completed!"

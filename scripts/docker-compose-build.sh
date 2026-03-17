#!/bin/bash

# Build and start services with docker-compose.
# Use --no-cache flag explicitly when a clean rebuild is needed:
#   NO_CACHE=true ./scripts/docker-compose-build.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

ENV_FILE="${ENV_FILE:-.env.local}"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "Error: $ENV_FILE not found in $PROJECT_ROOT"
  exit 1
fi

# Only export the true build-time variable needed by docker-compose build args
export NEXT_PUBLIC_SITE_URL

BUILD_FLAGS=""
if [ "${NO_CACHE:-false}" = "true" ]; then
  BUILD_FLAGS="--no-cache"
  echo "Clean build requested (NO_CACHE=true)"
fi

echo "Building services..."
# shellcheck disable=SC2086
docker compose build $BUILD_FLAGS

echo "Starting services..."
# --force-recreate ensures containers are always replaced with the freshly
# built images, even if Docker's image-change detection misses a layer update.
docker compose up -d --force-recreate

echo "Services started!"
docker compose ps

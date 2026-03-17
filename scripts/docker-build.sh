#!/bin/bash

# Build individual Docker images for web and worker targets.
# Runtime secrets are NOT passed as build args — they are injected at
# container startup via env_file / environment in docker-compose or the
# container runtime.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load environment from file (default: .env.local, override with ENV_FILE)
ENV_FILE="${ENV_FILE:-.env.local}"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "Error: $ENV_FILE not found in $PROJECT_ROOT"
  exit 1
fi

# Validate only the true build-time variables
REQUIRED_BUILD_VARS=("NEXT_PUBLIC_SITE_URL")
for var in "${REQUIRED_BUILD_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: Required build-time variable $var is not set or empty"
    exit 1
  fi
done

echo "All required build-time variables validated"

# Derive image tag from git SHA for traceability (falls back to 'latest')
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo "")"
TAG="${GIT_SHA:-latest}"

echo "Building web image (tag: $TAG)..."
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  --target web \
  -f apps/web/Dockerfile \
  -t rezumerai-web:"$TAG" \
  -t rezumerai-web:latest \
  .

echo "Building worker image (tag: $TAG)..."
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  --target worker \
  -f apps/web/Dockerfile \
  -t rezumerai-worker:"$TAG" \
  -t rezumerai-worker:latest \
  .

echo "Build complete! Tags: $TAG, latest"

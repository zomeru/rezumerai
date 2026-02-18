#!/bin/bash

# Docker build script with secrets from .env file
set -e

# Navigate to project root (parent of scripts directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load environment variables from .env.local using safe POSIX method
if [ -f .env.local ]; then
  set -a  # Enable auto-export
  source .env.local
  set +a  # Disable auto-export
else
  echo "Error: .env.local file not found in $PROJECT_ROOT"
  exit 1
fi

# Validate required environment variables
REQUIRED_ENV_VARS=(
  "DATABASE_URL"
  "NEXT_PUBLIC_API_URL"
  "BETTER_AUTH_URL"
  "BETTER_AUTH_SECRET"
  "API_PORT"
  "CORS_ORIGINS"
)

for var in "${REQUIRED_ENV_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: Required environment variable $var is not set or empty"
    exit 1
  fi
done

echo "All required environment variables validated successfully"

# Build API
echo "Building API service..."
docker build \
  --secret id=api_port,env=API_PORT \
  --secret id=cors_origins,env=CORS_ORIGINS \
  -f apps/api/Dockerfile \
  -t rezumerai-api:latest \
  .

# Build Web
echo "Building Web service..."
docker build \
  --secret id=next_public_api_url,env=NEXT_PUBLIC_API_URL \
  --secret id=BETTER_AUTH_URL,env=BETTER_AUTH_URL \
  --secret id=BETTER_AUTH_SECRET,env=BETTER_AUTH_SECRET \
  -f apps/web/Dockerfile \
  -t rezumerai-web:latest \
  .

echo "Build complete!"

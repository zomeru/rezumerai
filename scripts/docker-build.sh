#!/bin/bash

# Docker build script with secrets from .env file
set -e

# Navigate to project root (parent of scripts directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "Error: .env.local file not found in $PROJECT_ROOT"
  exit 1
fi

# Build API
echo "Building API service..."
docker build \
  --secret id=database_url,env=DATABASE_URL \
  --secret id=api_port,env=API_PORT \
  --secret id=cors_origins,env=CORS_ORIGINS \
  -f apps/api/Dockerfile \
  -t rezumerai-api:latest \
  .

# Build Web
echo "Building Web service..."
docker build \
  --secret id=database_url,env=DATABASE_URL \
  --secret id=next_public_api_url,env=NEXT_PUBLIC_API_URL \
  --secret id=nextauth_url,env=NEXTAUTH_URL \
  --secret id=nextauth_secret,env=NEXTAUTH_SECRET \
  -f apps/web/Dockerfile \
  -t rezumerai-web:latest \
  .

echo "Build complete!"

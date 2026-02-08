#!/bin/bash

# Docker Compose build with secrets
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

# Build and start with docker-compose
echo "Building services with docker-compose..."
docker compose build --no-cache

echo "Starting services..."
docker compose up -d

echo "Services started!"
docker compose ps

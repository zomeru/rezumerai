# ---- Base ----
FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
  libc6-dev libssl-dev openssl curl git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Prune ----
FROM base AS builder
COPY . .
# Prune only the 'api' app for a minimal Docker context
RUN bunx turbo@2.8.0 prune @rezumerai/api --docker

# ---- Install & Build ----
FROM base AS installer

# Copy pruned package manifests
COPY --from=builder /app/out/json/ .

# Install dependencies for the pruned workspace
RUN bun install --frozen-lockfile

# Copy full source needed for build
COPY --from=builder /app/out/full/ .

# Build the API and its dependencies
# Mount secrets for Prisma client generation
RUN --mount=type=secret,id=database_url \
    --mount=type=secret,id=api_port \
    --mount=type=secret,id=cors_origins \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    API_PORT="$(cat /run/secrets/api_port)" \
    CORS_ORIGINS="$(cat /run/secrets/cors_origins)" \
    bunx turbo@2.8.0 build --filter=@rezumerai/api

# ---- Runner ----
FROM oven/bun:1-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use the built-in bun user (uid 1000)
USER bun

# Copy only runtime artifacts (built API, database package, and production node_modules)
COPY --from=installer --chown=bun:bun /app/apps/api/dist ./apps/api/dist
COPY --from=installer --chown=bun:bun /app/apps/api/package.json ./apps/api/package.json
COPY --from=installer --chown=bun:bun /app/packages/database/dist ./packages/database/dist
COPY --from=installer --chown=bun:bun /app/packages/database/generated ./packages/database/generated
COPY --from=installer --chown=bun:bun /app/packages/database/package.json ./packages/database/package.json
COPY --from=installer --chown=bun:bun /app/packages/database/prisma ./packages/database/prisma
COPY --from=installer --chown=bun:bun /app/packages/types/dist ./packages/types/dist
COPY --from=installer --chown=bun:bun /app/packages/types/package.json ./packages/types/package.json
COPY --from=installer --chown=bun:bun /app/packages/utils/dist ./packages/utils/dist
COPY --from=installer --chown=bun:bun /app/packages/utils/package.json ./packages/utils/package.json
COPY --from=installer --chown=bun:bun /app/node_modules ./node_modules
COPY --from=installer --chown=bun:bun /app/package.json ./package.json

EXPOSE 8080

CMD ["bun", "run", "apps/api/dist/server.js"]

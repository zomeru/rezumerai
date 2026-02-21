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
RUN bunx turbo@2.8.10 prune @rezumerai/api --docker

# ---- Install & Build ----
FROM base AS installer

# Copy pruned package manifests
COPY --from=builder /app/out/json/ .

# Install all dependencies (including devDeps needed for build: prisma, tsup)
RUN bun pm pkg delete scripts.prepare && bun install --frozen-lockfile

# Copy full source needed for build
COPY --from=builder /app/out/full/ .

# Build the API and its dependencies
# Mount secrets for build configuration (DATABASE_URL uses placeholder for Prisma generation)
RUN --mount=type=secret,id=api_port \
    --mount=type=secret,id=cors_origins \
    export DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder" && \
    export API_PORT="$(cat /run/secrets/api_port)" && \
    export CORS_ORIGINS="$(cat /run/secrets/cors_origins)" && \
    (cd packages/database && bun run build:docker) && \
    bunx turbo@2.8.10 build --filter=@rezumerai/api

# ---- Runner ----
FROM oven/bun:1-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use the built-in bun user (uid 1000)
USER bun

# Copy only runtime artifacts:
# - The compiled standalone binary (bun build --compile bundles all JS)
# - Prisma generated client (contains the native query engine binary)
# - Prisma schema (needed for runtime schema validation)
# - Compiled package dist outputs
COPY --from=installer --chown=bun:bun /app/apps/api/server ./apps/api/server
COPY --from=installer --chown=bun:bun /app/packages/database/dist ./packages/database/dist
COPY --from=installer --chown=bun:bun /app/packages/database/generated ./packages/database/generated
COPY --from=installer --chown=bun:bun /app/packages/database/package.json ./packages/database/package.json
COPY --from=installer --chown=bun:bun /app/packages/database/prisma ./packages/database/prisma
COPY --from=installer --chown=bun:bun /app/packages/types/dist ./packages/types/dist
COPY --from=installer --chown=bun:bun /app/packages/types/package.json ./packages/types/package.json
COPY --from=installer --chown=bun:bun /app/packages/utils/dist ./packages/utils/dist
COPY --from=installer --chown=bun:bun /app/packages/utils/package.json ./packages/utils/package.json

RUN chmod +x ./apps/api/server

EXPOSE 8080

CMD ["./apps/api/server"]

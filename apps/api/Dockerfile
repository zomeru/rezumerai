# ---- Base ----
FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y \
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
ENV DATABASE_URL=${DATABASE_URL}

# Copy pruned package manifests
COPY --from=builder /app/out/json/ .

# Install dependencies for the pruned workspace
RUN bun install --frozen-lockfile

# Copy full source needed for build
COPY --from=builder /app/out/full/ .

# Build the API and its dependencies
RUN bunx turbo@2.8.0 build --filter=@rezumerai/api

# ---- Runner ----
FROM oven/bun:1-slim AS runner
RUN apt-get update && apt-get install -y \
  openssl curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

# Copy built output
COPY --from=installer /app/ .

USER appuser
EXPOSE 8080

CMD ["bun", "run", "apps/api/dist/server.js"]

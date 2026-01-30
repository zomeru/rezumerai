# ---- Base ----
FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y \
  libc6-dev libssl-dev openssl curl git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Prune ----
FROM base AS builder
COPY . .
# Prune only the 'server' app for a minimal Docker context
RUN bunx turbo@2.8.0 prune server --docker

# ---- Install & Build ----
FROM base AS installer
ENV DATABASE_URL=${DATABASE_URL}

# Copy pruned package manifests
COPY --from=builder /app/out/json/ .

# Install dependencies for the pruned workspace
RUN bun install --frozen-lockfile

# Copy full source needed for build
COPY --from=builder /app/out/full/ .

# ----------------------------------------------------------
# Turborepo Remote Caching (Optional)
# Uncomment and configure these for remote caching support.
#
# ARG TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TEAM=$TURBO_TEAM
# ENV TURBO_TOKEN=$TURBO_TOKEN
# ----------------------------------------------------------

# Build the server app
RUN bunx turbo@2.8.0 build --filter=server

# ---- Runner ----
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Use the built-in bun user (uid 1000)
USER bun

# Copy built server app from installer
COPY --from=installer --chown=bun:bun /app .

EXPOSE 8080
CMD ["bun", "run", "apps/server/dist/index.js"]

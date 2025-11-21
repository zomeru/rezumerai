# ---- Base ----
FROM node:22.20.0-slim AS base
RUN apt-get update && apt-get install -y \
  libc6-dev libssl-dev openssl curl git \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate
WORKDIR /app

# ---- Prune ----
FROM base AS builder
COPY . .
# Prune only the 'server' app for a minimal Docker context
RUN pnpm dlx turbo@^2.5.8 prune server --docker

# ---- Install & Build ----
FROM base AS installer
# Copy pruned package manifests
COPY --from=builder /app/out/json/ .

# Install dependencies for the pruned workspace
RUN pnpm install --frozen-lockfile

# Copy full source needed for build
COPY --from=builder /app/out/full/ .

# ----------------------------------------------------------
# 🧠 Turborepo Remote Caching (Optional)
# Uncomment and configure these for remote caching support.
#
# ARG TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TEAM=$TURBO_TEAM
# ENV TURBO_TOKEN=$TURBO_TOKEN
# ----------------------------------------------------------

# Build the server app
RUN pnpm dlx turbo@^2.5.8 build --filter=server

# ---- Runner ----
FROM node:22.20.0-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 expressjs \
  && adduser --system --uid 1001 expressjs
USER expressjs

# Copy built server app from installer
COPY --from=installer /app .

EXPOSE 8080
CMD ["node", "apps/server/dist/index.js"]

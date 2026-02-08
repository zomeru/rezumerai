# ---- Base ----
FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
  libc6-dev libssl-dev openssl curl git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Prune ----
FROM base AS builder
COPY . .
# Prune only the 'web' app for a minimal Docker context
RUN bunx turbo@2.8.0 prune web --docker

# ---- Install & Build ----
FROM base AS installer

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

# Build the web app
# Mount secrets for Prisma client generation and Next.js build
RUN --mount=type=secret,id=database_url \
    --mount=type=secret,id=next_public_api_url \
    --mount=type=secret,id=nextauth_url \
    --mount=type=secret,id=nextauth_secret \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    NEXT_PUBLIC_API_URL="$(cat /run/secrets/next_public_api_url)" \
    NEXTAUTH_URL="$(cat /run/secrets/nextauth_url)" \
    NEXTAUTH_SECRET="$(cat /run/secrets/nextauth_secret)" \
    bunx turbo@2.8.0 build --filter=web

# ---- Runner ----
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Use the built-in bun user (uid 1000)
USER bun

# Copy built app from installer
COPY --from=installer --chown=bun:bun /app/apps/web/.next/standalone ./
COPY --from=installer --chown=bun:bun /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=bun:bun /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["bun", "run", "apps/web/server.js"]

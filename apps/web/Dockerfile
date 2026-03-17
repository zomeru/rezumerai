# ── deps: install dependencies (cached unless lockfile/manifests change) ──────
FROM oven/bun:1 AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  libc6-dev libssl-dev openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy only manifests first — maximises layer cache reuse
COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/

RUN bun install --frozen-lockfile

# ── builder: compile the web app ──────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

# Only build-time public variables are needed here.
# Runtime secrets (DATABASE_URL, auth keys, etc.) are injected at container
# startup via env_file / environment — NOT baked into the image.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=production

# Copy full source after deps are cached
COPY . .

# Generate Prisma client.
# prisma generate only reads the schema — it never opens a DB connection.
# prisma.config.ts calls env("DIRECT_URL") which requires the var to be present,
# so we supply throw-away placeholder values scoped to this RUN layer only.
# These values are NOT baked into the image (no ENV instruction).
RUN rm -rf packages/database/generated && \
    cd packages/database && \
    DATABASE_URL="postgresql://build:build@build/build?schema=public" \
    DIRECT_URL="postgresql://build:build@build/build?schema=public" \
    bunx prisma generate && \
    bunx tsdown

# Build Next.js standalone output.
# During `next build`, Next.js evaluates server module imports to collect page
# configuration (including the /api/[[...slugs]] route which creates the Elysia
# app and calls getServerEnv()). Placeholder values below satisfy Zod schema
# validation for that module-initialisation pass.
#
# These values are scoped to this RUN layer's shell ONLY — no ENV instruction,
# never baked into the image, no real network calls are made.
#
# Note: BETTER_AUTH_SECRET requires >= 32 chars; BETTER_AUTH_URL requires a URL.
RUN cd apps/web && \
    DATABASE_URL="postgresql://build:build@build/build?schema=public" \
    DIRECT_URL="postgresql://build:build@build/build?schema=public" \
    BETTER_AUTH_URL="http://localhost:3000" \
    BETTER_AUTH_SECRET="build-time-placeholder-secret-key-32" \
    BETTER_AUTH_GITHUB_CLIENT_ID="build_placeholder" \
    BETTER_AUTH_GITHUB_CLIENT_SECRET="build_placeholder" \
    OPENROUTER_API_KEY="sk-build-placeholder" \
    bun run next build

# ── web: production web server ────────────────────────────────────────────────
FROM oven/bun:1-slim AS web
WORKDIR /app
ENV NODE_ENV=production
# Next.js standalone server reads HOSTNAME to decide what interface to bind.
# Default is "localhost" which is unreachable from the Docker healthcheck or
# from other containers. Bind to all interfaces so the server is accessible.
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

USER bun

COPY --from=builder --chown=bun:bun /app/apps/web/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=bun:bun /app/apps/web/public ./apps/web/public

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

CMD ["bun", "run", "apps/web/server.js"]

# ── worker: background job processor ─────────────────────────────────────────
FROM oven/bun:1-slim AS worker
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

USER bun

# Worker needs the full monorepo (source + packages) since it is not bundled
# into the Next standalone output.  Copy only the necessary artifacts.
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/apps/web ./apps/web
COPY --from=builder --chown=bun:bun /app/packages ./packages
COPY --from=builder --chown=bun:bun /app/package.json ./
COPY --from=builder --chown=bun:bun /app/turbo.json ./

HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD pgrep -x bun || exit 1

CMD ["bun", "run", "apps/web/src/worker.ts"]

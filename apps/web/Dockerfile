FROM node:22-slim AS base 

FROM base AS builder
RUN apt-get update && apt-get install -y \
    libc6-dev libssl-dev openssl curl git && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate
COPY . .
RUN pnpm dlx turbo@^2.5.8 prune web --docker

# Add lockfile and package.json's of isolated workspace
FROM base AS installer
RUN apt-get update && apt-get install -y \
    libc6-dev libssl-dev openssl curl git && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

# First install dependencies for the pruned workspace
COPY --from=builder /app/out/json/ .

RUN corepack enable && corepack prepare pnpm@10.18.2 --activate
RUN pnpm install

# Build the project in the full workspace
COPY --from=builder /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm dlx turbo@^2.5.8 build --filter=web

FROM base AS runner
WORKDIR /app

# Don't run production container as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]







# ---------------------
# --- Base stage ---
# FROM node:22-slim AS base
# WORKDIR /app

# RUN apt-get update && apt-get install -y \
#     libc6-dev libssl-dev openssl curl git && \
#     rm -rf /var/lib/apt/lists/*

# RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

# COPY . .

# RUN pnpm install --frozen-lockfile

# # --- Builder stage ---
# FROM base AS builder
# WORKDIR /app

# COPY --from=base /app /app

# # Turbo prune web app (temporary turbo CLI)
# RUN pnpm dlx turbo prune web --docker

# # Install only production deps for pruned workspace
# WORKDIR /app/out/json
# RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# # Copy full pruned source for build
# WORKDIR /app/out/full
# RUN cp -R . /app/full

# # Install turbo CLI for building
# RUN pnpm add -w turbo@^2.5.8

# # Set NODE_PATH so node_modules from /app/out/json can be used
# ENV NODE_PATH=/app/out/json/node_modules

# # Build web app from full source
# WORKDIR /app
# RUN pnpm turbo run build --filter=web...

# # --- Runner stage ---
# FROM node:22-slim AS runner
# WORKDIR /app

# RUN apt-get update && apt-get install -y libc6-dev libssl-dev openssl && rm -rf /var/lib/apt/lists/*

# RUN addgroup --system nextjs && adduser --system --ingroup nextjs nextjs
# USER nextjs

# COPY --from=builder /app/out/json/node_modules ./node_modules
# COPY --from=builder /app/out/full/apps/web/.next/standalone ./
# COPY --from=builder --chown=nextjs:nextjs /app/out/full/apps/web/.next/static ./apps/web/.next/static
# COPY --from=builder --chown=nextjs:nextjs /app/out/full/apps/web/public ./apps/web/public

# EXPOSE 3000
# CMD ["node", "apps/web/server.js"]

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
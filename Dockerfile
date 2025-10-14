# Multi-stage Dockerfile for production builds
FROM node:24-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.18.2

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY . .
RUN pnpm build

# Production server image
FROM node:24-alpine AS server
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.18.2

# Copy built server
COPY --from=builder /app/apps/server/dist ./server/
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 8080
CMD ["node", "server/index.js"]

# Production web image  
FROM node:24-alpine AS web
WORKDIR /app

# Copy built Next.js app
COPY --from=builder /app/apps/web/.next ./.next/
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/public ./public/
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 3000
CMD ["npm", "start"]
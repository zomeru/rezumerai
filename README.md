# RezumerAI Monorepo Setup Guide

This guide explains how to set up and run the RezumerAI monorepo both locally and using Docker, following Turborepo best practices.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v22+ recommended)
- [pnpm](https://pnpm.io/) (v10.20.0, managed via Corepack)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

---

## Local Development

### 1. Install Dependencies

Enable and pin pnpm using Corepack:

```sh
corepack enable && corepack prepare pnpm@10.20.0 --activate
```

Install all dependencies:

```sh
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file and edit as needed:

```sh
cp .env.example .env.local
```

Edit `.env.local` to set your database, Redis, and other secrets.

### 3. Database Setup

Start a local PostgreSQL instance (or use Docker):

```sh
# Using Docker Compose (recommended for DB/Redis only)
docker-compose up db redis
```

Run migrations (if using Prisma):

```sh
pnpm --filter=database run migrate:dev
```

### 4. Build and Run Apps

#### Web (Next.js)

```sh
pnpm --filter=web dev
```

#### API (Express)

```sh
pnpm --filter=server dev
```

---

## Running with Docker

### 1. Build and Start All Services

```sh
# Build all images and start all services
docker-compose up --build
```

- Web app: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8080](http://localhost:8080)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 2. Stopping Services

```sh
docker-compose down
```

---

## Project Structure

- `apps/web` – Next.js frontend (has its own Dockerfile)
- `apps/server` – Express API (has its own Dockerfile)
- `packages/` – Shared code (database, types, utils, etc.)
- `docker-compose.yml` – Orchestrates all services



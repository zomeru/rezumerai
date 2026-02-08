# Rezumer

A fullstack TypeScript monorepo for building AI-powered resume tools, managed with **Turborepo** and **Bun**.

## Prerequisites

- [Bun](https://bun.sh/) (v1.3.8+)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for containerized development)

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 16+, React 19, TypeScript, Tailwind CSS 4.x |
| Backend | Elysia, Bun, TypeScript |
| Database | PostgreSQL with Prisma 7.x ORM |
| State | Zustand |
| API | Eden for end-to-end type safety |
| Testing | Vitest 4.x, React Testing Library |
| Build | Turborepo, Bun |
| Code Quality | Biome |

## Quick Start

### 1. Install Bun

```sh
curl -fsSL https://bun.sh/install | bash
```

### 2. Install Dependencies

```sh
bun install
```

### 3. Set Up Environment Variables

```sh
cp .env.example .env.local
```

Edit `.env.local` to set your database, Redis, and other secrets.

### 4. Database Setup

Start PostgreSQL and Redis:

```sh
bun run docker:db
```

Set up the database schema:

```sh
bun run db:setup
```

### 5. Run Development Servers

```sh
bun run dev
```

Or run individually:

```sh
bun run --filter=web dev       # Web (Next.js) - http://localhost:3000
bun run --filter=@rezumerai/api dev    # API (Elysia) - http://localhost:8080
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all packages and apps |
| `bun run test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:ui` | Open Vitest UI |
| `bun run test:coverage` | Run tests with coverage |
| `bun run code:check` | Run linting and type checking |
| `bun run check` | Run Biome linting |
| `bun run check-types` | Run TypeScript type checking |
| `bun run clean` | Clean all build artifacts |
| `bun run clean:install` | Clean and reinstall everything |
| `bun run db:setup` | Push schema and generate Prisma client |
| `bun run db:studio` | Open Prisma Studio (port 5556) |
| `bun run db:reset` | Reset database (destroys data) |

## Running with Docker

### Build and Start All Services

```sh
bun run docker:build
```

Or manually:

```sh
docker compose up --build
```

### Service URLs

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Prisma Studio | http://localhost:5556 |

### Stopping Services

```sh
bun run docker:down
```

## Project Structure

```
rezumerai/
├── apps/
│   ├── web/                          # Next.js 16+ frontend
│   │   └── src/
│   │       ├── app/                  # Next.js App Router
│   │       ├── components/           # React components
│   │       ├── hooks/                # Custom React hooks
│   │       ├── lib/                  # Library utilities
│   │       ├── store/                # Zustand state stores
│   │       ├── templates/            # Resume templates
│   │       └── constants/            # App constants
│   │
│   └── api/                          # Elysia API (Bun-native)
│       └── src/
│           ├── app.ts                # Elysia app (single source of truth)
│           ├── server.ts             # Bun server entrypoint
│           ├── env.ts                # Typed env (Zod)
│           ├── modules/              # Feature modules (auth, user)
│           └── plugins/              # Plugins (prisma, auth, logger, error)
│
├── packages/
│   ├── database/                     # Prisma 7.x ORM
│   │   └── prisma/schema.prisma      # Database schema
│   ├── types/                        # Shared TypeScript types
│   ├── ui/                           # Shared UI components
│   ├── utils/                        # Shared utility functions
│   ├── vitest-config/                # Shared Vitest configuration
│   └── tsconfig/                     # Shared TypeScript configs
│
├── biome.json                        # Biome config
├── turbo.json                        # Turborepo config
├── docker-compose.yml                # Docker orchestration
└── package.json                      # Root package.json
```

## Development Guidelines

- **Package Manager**: Always use Bun (`bun install`, `bun run`, etc.)
- **Code Style**: Biome handles all linting and formatting
- **Type Safety**: TypeScript strict mode is enabled everywhere
- **Testing**: Write tests alongside your code using Vitest
- **State Management**: Use Zustand for client-side state
- **API**: Use Eden for type-safe API consumption (types inferred from Elysia)

## License

Private - All rights reserved.

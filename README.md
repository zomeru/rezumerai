# RezumerAI Monorepo

A fullstack TypeScript monorepo for building AI-powered resume tools, managed with **Turborepo** and **Bun**.

---

## Prerequisites

- [Bun](https://bun.sh/) (v1.3.8+)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for containerized development)

---

## Tech Stack

- **Frontend**: Next.js 16+, React 19, TypeScript, Tailwind CSS
- **Backend**: Express, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest, React Testing Library
- **Build Tools**: Turborepo, Bun
- **Code Quality**: Biome (linting & formatting)

---

## Local Development

### 1. Install Bun

If you don't have Bun installed:

```sh
curl -fsSL https://bun.sh/install | bash
```

### 2. Install Dependencies

```sh
bun install
```

### 3. Set Up Environment Variables

Copy the example environment file and edit as needed:

```sh
cp .env.example .env.local
```

Edit `.env.local` to set your database, Redis, and other secrets.

### 4. Database Setup

Start a local PostgreSQL instance using Docker:

```sh
bun run docker:db
```

Set up the database schema:

```sh
bun run db:setup
```

### 5. Run Development Servers

Run all apps in development mode:

```sh
bun run dev
```

Or run individually:

```sh
# Web (Next.js) - http://localhost:3000
bun run --filter=web dev

# API (Express) - http://localhost:8080
bun run --filter=server dev
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all packages and apps |
| `bun run test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run code:check` | Run linting and type checking |
| `bun run check` | Run Biome linting |
| `bun run check-types` | Run TypeScript type checking |
| `bun run clean` | Clean all build artifacts and node_modules |
| `bun run db:setup` | Push schema and generate Prisma client |
| `bun run db:studio` | Open Prisma Studio |

---

## Running with Docker

### 1. Build and Start All Services

```sh
bun run docker:build
```

Or manually:

```sh
docker compose up --build
```

### 2. Service URLs

- **Web app**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Stopping Services

```sh
bun run docker:down
```

---

## Project Structure

```
rezumerai/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── server/              # Express API
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   ├── utils/               # Shared utilities
│   ├── vitest-config/       # Shared Vitest configuration
│   └── tsconfig/            # Shared TypeScript configs
├── bunfig.toml              # Bun configuration
├── turbo.json               # Turborepo configuration
└── docker-compose.yml       # Docker orchestration
```

---

## Development Guidelines

- **Package Manager**: Always use Bun (`bun install`, `bun run`, etc.)
- **Code Style**: Biome handles all linting and formatting
- **Type Safety**: TypeScript strict mode is enabled everywhere
- **Testing**: Write tests alongside your code using Vitest


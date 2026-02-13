# Rezumer

A fullstack TypeScript monorepo for building AI-powered resume tools, managed with **Turborepo** and **Bun**.

## Prerequisites

- [Bun](https://bun.sh/) (v1.x+)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for containerized development)

## Tech Stack

| Category       | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Frontend       | Next.js 16+, React 19, React Compiler, TypeScript 5.x+   |
| Styling        | Tailwind CSS 4.x (PostCSS)                               |
| Backend        | Elysia 1.x+, Bun 1.x+, TypeScript                       |
| Database       | PostgreSQL 18 with Prisma 7.x ORM                        |
| State          | Zustand 5.x                                              |
| Data Fetching  | TanStack React Query 5.x, Eden (Elysia type-safe client) |
| Rich Text      | TipTap 3.x                                               |
| PDF            | @react-pdf/renderer, jspdf, html2canvas-pro               |
| Drag & Drop    | @dnd-kit/core + @dnd-kit/sortable                        |
| Testing        | Vitest 4.x, React Testing Library                        |
| Build          | Turborepo, Turbopack, Bun                                |
| Code Quality   | Biome 2.x+                                               |
| Git Hooks      | Husky + lint-staged                                      |
| Containerization | Docker, docker-compose                                 |

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

Edit `.env.local` to set your database and other secrets.

### 4. Database Setup

Start PostgreSQL:

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
│   │       ├── app/                  # Next.js App Router (pages, layouts, error boundaries)
│   │       ├── components/           # React components (Home, Dashboard, ResumeBuilder)
│   │       ├── hooks/                # Custom hooks (useClickOutside, useFocusTrap, usePdfGenerator)
│   │       ├── lib/                  # Utilities (api, api-client, errors, retry, pdfUtils)
│   │       ├── store/                # Zustand stores (useResumeStore, useBuilderStore, useDashboardStore)
│   │       ├── templates/            # Resume templates (Classic, Modern, Minimal, MinimalImage)
│   │       ├── constants/            # App constants (routing, dummy data, PDF, templates)
│   │       ├── env.ts                # Zod-validated environment variables
│   │       └── proxy.ts              # Security middleware (CSP, HSTS)
│   │
│   └── api/                          # Elysia API (Bun-native)
│       └── src/
│           ├── app.ts                # Elysia app (exports App type for Eden)
│           ├── server.ts             # Bun server entrypoint
│           ├── env.ts                # Zod-validated env (API_PORT, DATABASE_URL, etc.)
│           ├── modules/              # Feature modules (auth, user)
│           └── plugins/              # Plugins (prisma, auth, logger, error)
│
├── packages/
│   ├── database/                     # Prisma 7.x ORM (PrismaPg adapter)
│   │   ├── prisma/schema.prisma      # Database schema
│   │   ├── generated/prisma/          # Generated Prisma client
│   │   └── index.ts                  # Prisma singleton export
│   ├── types/                        # Shared TypeScript types & Zod schemas
│   ├── ui/                           # Shared UI components (shadcn/ui based)
│   ├── utils/                        # Shared utilities (date, string, styles/cn)
│   ├── vitest-config/                # Shared Vitest configuration (base, react, node)
│   └── tsconfig/                     # Shared TypeScript configs
│
├── biome.json                        # Biome linter/formatter config
├── turbo.json                        # Turborepo config
├── docker-compose.yml                # Docker orchestration (PostgreSQL, web, api)
└── package.json                      # Root package.json (Bun workspaces)
```

## Development Guidelines

- **Package Manager**: Always use Bun (`bun install`, `bun run`, etc.) — never npm, yarn, or pnpm
- **Code Style**: Biome handles all linting and formatting (120 char width, double quotes, sorted Tailwind classes)
- **Type Safety**: TypeScript strict mode everywhere with explicit return types enforced
- **Testing**: Write tests alongside your code using Vitest 4.x + React Testing Library. Tests are co-located with components in `__tests__` folders (e.g., `components/Badge.tsx` → `components/__tests__/Badge.test.tsx`). Root-level components keep tests in `src/__tests__`. Use relative imports in test files. Aim for 100% coverage on new components.
- **State Management**: Zustand 5.x for client-side state, TanStack React Query 5.x for server state
- **API**: Eden treaty for end-to-end type-safe API consumption (types inferred from Elysia)
- **Routing**: Use `ROUTES` constants from `constants/routing.ts` — never hardcode route strings
- **Styling**: Tailwind CSS 4.x only — no inline styles; use `cn()` for class merging
- **Security**: CSP headers, HSTS, X-Frame-Options via `proxy.ts` middleware
- **Git Hooks**: Husky + lint-staged run `biome check --write` on every commit

## License

Private - All rights reserved.

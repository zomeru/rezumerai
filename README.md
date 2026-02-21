# Rezumer

A fullstack TypeScript monorepo for building AI-powered resume tools, managed with **Turborepo** and **Bun**.

## Prerequisites

- [Bun](https://bun.sh/) v1.x+
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## Tech Stack

| Category         | Technology                                                |
| ---------------- | --------------------------------------------------------- |
| Frontend         | Next.js 16+, React 19, React Compiler, TypeScript 5.x+   |
| Styling          | Tailwind CSS 4.x (PostCSS)                               |
| Backend          | Elysia 1.x+, Bun 1.x+, TypeScript                       |
| Auth             | Better Auth 1.x+                                         |
| Database         | PostgreSQL 18 with Prisma 7.x ORM                        |
| State            | Zustand 5.x                                              |
| Data Fetching    | TanStack React Query 5.x, Eden (Elysia type-safe client) |
| Rich Text        | TipTap 3.x                                               |
| PDF              | @react-pdf/renderer, jspdf, html2canvas-pro              |
| Drag & Drop      | @dnd-kit/core + @dnd-kit/sortable                        |
| Testing          | Bun Test, React Testing Library                          |
| Build            | Turborepo, Turbopack, Bun                                |
| Code Quality     | Biome 2.x+                                               |
| Git Hooks        | Husky + lint-staged                                       |
| Containerization | Docker, docker-compose                                   |

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

Edit `.env.local` with your values:

```env
# PostgreSQL (Docker)
POSTGRES_DB=rezumerai
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# Database
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/rezumerai

# Better Auth
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000

# GitHub OAuth (optional)
BETTER_AUTH_GITHUB_CLIENT_ID=your_github_client_id
BETTER_AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret

# API
NEXT_PUBLIC_API_URL=http://localhost:8080
API_PORT=8080
CORS_ORIGINS=http://localhost:3000
```

### 4. Start the Database

```sh
bun run docker:db
```

### 5. Set Up the Database Schema

```sh
bun run db:setup
```

### 6. Run Development Servers

```sh
bun run dev
```

Or run individually:

```sh
bun run --filter=web dev            # Next.js — http://localhost:3000
bun run --filter=@rezumerai/api dev # Elysia API — http://localhost:8080
```

## Available Scripts

### Development

| Script | Description |
|--------|-------------|
| `bun run dev` | Start all apps in development mode |
| `bun run start` | Start all apps in production mode |

### Build

| Script | Description |
|--------|-------------|
| `bun run build` | Build all packages and apps |
| `bun run build:production` | Production build with `NODE_ENV=production` |
| `bun run build:web` | Build web app only |
| `bun run build:api` | Build API only |
| `bun run build:packages` | Build all shared packages |

### Testing

| Script | Description |
|--------|-------------|
| `bun run test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |
| `bun run test:project` | Build packages, then run all tests |

### Code Quality

| Script | Description |
|--------|-------------|
| `bun run check` | Run Biome linting with auto-fix |
| `bun run check-types` | TypeScript type checking |
| `bun run code:check` | Lint + type checking |
| `bun run code:verify` | Lint + types + tests + build |

### Database

| Script | Description |
|--------|-------------|
| `bun run docker:db` | Start PostgreSQL container |
| `bun run db:setup` | Push schema and generate Prisma client |
| `bun run db:studio` | Open Prisma Studio (http://localhost:5556) |
| `bun run db:reset` | Reset database — **destroys all data** |

### Docker

| Script | Description |
|--------|-------------|
| `bun run docker:build` | Build and start all containers |
| `bun run docker:up` | Start containers |
| `bun run docker:down` | Stop containers |

### Maintenance

| Script | Description |
|--------|-------------|
| `bun run clean` | Remove build artifacts |
| `bun run clean:install` | Clean, reinstall, and rebuild packages |
| `bun run security:audit` | Audit production dependencies |

## Running with Docker

Docker Compose orchestrates three services: PostgreSQL, the web app, and the API. Sensitive values are passed via Docker secrets from your `.env.local`.

```sh
bun run docker:build
```

| Service       | URL                        |
|---------------|----------------------------|
| Web app       | http://localhost:3000      |
| API           | http://localhost:8080      |
| PostgreSQL    | localhost:5432             |
| Prisma Studio | http://localhost:5556      |

```sh
bun run docker:down
```

## Project Structure

```
rezumerai/
├── apps/
│   ├── web/                          # Next.js 16+ frontend
│   │   └── src/
│   │       ├── app/                  # App Router (pages, layouts, error boundaries)
│   │       │   └── api/auth/         # Better Auth handler (Next.js route)
│   │       ├── components/           # React components (Home, Dashboard, ResumeBuilder)
│   │       ├── hooks/                # Custom hooks (useClickOutside, useClientDate, useFocusTrap, usePdfGenerator)
│   │       ├── lib/                  # Client utilities (api, api-client, auth, auth-client, errors, pdfUtils, retry)
│   │       ├── store/                # Zustand stores (useResumeStore, useBuilderStore, useDashboardStore)
│   │       ├── templates/            # Resume templates (Classic, Modern, Minimal, MinimalImage)
│   │       ├── constants/            # App constants (routing, dummy data, PDF, templates)
│   │       ├── types/                # App-local TypeScript types
│   │       ├── env.ts                # Zod-validated environment variables
│   │       └── proxy.ts              # Security middleware (CSP, HSTS, X-Frame-Options)
│   │
│   └── api/                          # Elysia API (Bun-native)
│       └── src/
│           ├── index.ts              # Bun server entrypoint
│           ├── app.ts                # Elysia app (exports App type for Eden)
│           ├── env.ts                # Zod-validated env (API_PORT, DATABASE_URL, etc.)
│           ├── modules/              # Feature modules (resume, user)
│           └── plugins/              # Plugins (prisma, auth, error, logger, modernCsrf)
│
├── packages/
│   ├── database/                     # Prisma 7.x ORM (PrismaPg adapter)
│   │   ├── prisma/schema.prisma      # Database schema
│   │   ├── generated/prisma/         # Generated Prisma client
│   │   └── index.ts                  # Prisma singleton export
│   ├── types/                        # Shared TypeScript types & Zod schemas
│   ├── ui/                           # Shared UI components (shadcn/ui based)
│   ├── utils/                        # Shared utilities (date, string, styles/cn)
│   └── tsconfig/                     # Shared TypeScript configs
│
├── scripts/                          # Docker and config helper scripts
├── biome.json                        # Biome linter/formatter config
├── turbo.json                        # Turborepo config
├── docker-compose.yml                # Docker orchestration
└── package.json                      # Root package.json (Bun workspaces)
```

## Development Guidelines

- **Package Manager**: Always use Bun — never npm, yarn, or pnpm
- **Code Style**: Biome handles all linting and formatting (120 char width, double quotes, sorted Tailwind classes)
- **Type Safety**: TypeScript strict mode everywhere with explicit return types enforced
- **Auth**: Better Auth handles authentication; the Elysia `auth` plugin validates sessions and injects `user` into context; the Next.js `app/api/auth` route handles auth endpoints
- **API**: Eden treaty provides end-to-end type-safe API calls (types inferred from the Elysia `App` export)
- **State Management**: Zustand 5.x for client-side state, TanStack React Query 5.x for server state
- **Routing**: Use `ROUTES` constants from `constants/routing.ts` — never hardcode route strings
- **Styling**: Tailwind CSS 4.x only — no inline styles; use `cn()` for class merging
- **Testing**: Co-locate tests with components in `__tests__` folders. Use Bun test runner (`bun:test`) + React Testing Library. Aim for 100% coverage on new components.
- **Git Hooks**: Husky + lint-staged run `biome check --write` on every commit

## License

Private — All rights reserved.

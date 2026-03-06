# Rezumerai

AI-powered resume builder in a fullstack TypeScript monorepo.

- Monorepo: Turborepo + Bun workspaces
- Frontend: Next.js 16 App Router + React 19
- API: Elysia embedded in the web app (`/api/[[...slugs]]`)
- Database: PostgreSQL + Prisma 7
- Auth: Better Auth
- AI: OpenRouter-powered text optimization

## Prerequisites

- [Bun](https://bun.sh/) `1.3.x`
- PostgreSQL (local or hosted)
- Docker (optional, for container workflow)

## Quick Start

1. Install dependencies

```sh
bun install
```

2. Configure environment variables

```sh
cp .env.example .env.local
```

Minimum variables for local development:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="..."
BETTER_AUTH_GITHUB_CLIENT_ID="..."
BETTER_AUTH_GITHUB_CLIENT_SECRET="..."
OPENROUTER_API_KEY="..."
```

Optional:

- `BETTER_AUTH_GOOGLE_CLIENT_ID`
- `BETTER_AUTH_GOOGLE_CLIENT_SECRET`
- `CRON_SECRET`
- `REDIS_URL`
- `SENTRY_DSN`
- `ANALYTICS_ID`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`

3. Initialize database

```sh
bun run db:setup
```

4. Start development

```sh
bun run dev
```

Notes:

- Root `predev` builds `@rezumerai/database` before `turbo dev`.
- `apps/web` also runs a `predev` script to download the PDF worker used by `react-pdf`.

## Development Workflow

Run only the web app:

```sh
bun run --filter=web dev
```

Common quality checks:

```sh
bun run check
bun run check:types
bun run test
bun run build
```

Single pre-PR command:

```sh
bun run code:verify
```

## Root Scripts

### Build and Run

| Script | Description |
| --- | --- |
| `bun run dev` | Start monorepo dev tasks (`turbo dev`) |
| `bun run start` | Start production tasks (`turbo start`) |
| `bun run build` | Build all apps/packages |
| `bun run build:production` | Build with `NODE_ENV=production` |
| `bun run build:packages` | Build only `packages/*` |

### Code Quality and Tests

| Script | Description |
| --- | --- |
| `bun run check` | Sync Biome version + run workspace Biome checks |
| `bun run biome` | Direct Biome check/write from root |
| `bun run check:types` | Workspace type checks |
| `bun run code:check` | `check` + `check:types` |
| `bun run test` | Workspace tests |
| `bun run test:watch` | Workspace tests in watch mode |
| `bun run test:coverage` | Workspace tests with coverage |
| `bun run code:verify` | Lint + types + tests + build |

### Database

| Script | Description |
| --- | --- |
| `bun run db:setup` | `db:push` + `db:generate` |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Push schema |
| `bun run db:migrate` | Deploy migrations |
| `bun run db:migrate:dev` | Create/apply dev migration |
| `bun run db:migrate:status` | Migration status |
| `bun run db:pull` | Pull schema from DB |
| `bun run db:seed` | Seed DB |
| `bun run db:seed:ai` | Seed AI-related data |
| `bun run db:studio` | Prisma Studio (port `5556`) |
| `bun run db:reset` | Force reset DB |

### Docker and Maintenance

| Script | Description |
| --- | --- |
| `bun run docker:build` | Build + start Docker compose services |
| `bun run docker:build:standalone` | Build standalone web image |
| `bun run docker:up` | Start Docker compose services |
| `bun run docker:down` | Stop Docker compose services |
| `bun run start:redis` | Start Redis service via compose (if defined) |
| `bun run clean` | Remove build/test artifacts |
| `bun run clean:install` | Clean + reinstall + rebuild packages |
| `bun run outdated` | Check outdated dependencies |
| `bun run security:audit` | Bun production audit |
| `bun run security:check` | Audit-ci check |

## Architecture Overview

### Web + API in one app

- Next.js routes are in `apps/web/src/app`.
- API is mounted via `apps/web/src/app/api/[[...slugs]]/route.ts`.
- Better Auth handler is at `apps/web/src/app/api/auth/[...all]/route.ts`.

### Elysia API modules

`apps/web/src/elysia-api/app.ts` composes plugins and modules:

- Modules: `user`, `resume`, `ai`
- Plugins: auth, prisma, error handling, logger, CSRF, OpenTelemetry/trace, CORS, helmet, rate limit
- Dev-only docs: Swagger/OpenAPI
- Health route: `GET /api/health`

### Shared packages

- `@rezumerai/database`: Prisma client, schema, migrations, seed scripts
- `@rezumerai/types`: shared Zod schemas/types (resume, user, ai)
- `@rezumerai/utils`: helper utilities
- `@rezumerai/ui`: shared UI components
- `@rezumerai/tsconfig`: TS presets

## Repository Layout

```txt
apps/
  web/
    src/
      app/
      elysia-api/
      components/
      hooks/
      lib/
      providers/
      store/
      templates/
      constants/
      env.ts
      proxy.ts
packages/
  database/
  types/
  utils/
  ui/
  tsconfig/
scripts/
  docker-build.sh
  docker-compose-build.sh
  update-biome-config-version.ts
```

## Conventions

- Use Bun for package management and scripts.
- Use `ROUTES` from `apps/web/src/constants/routing.ts` instead of hardcoded route strings.
- Keep shared logic in packages instead of duplicating in app code.
- Use Biome for formatting/linting.
- Use colocated `__tests__` and Bun test runner conventions used in each package/app.

## Docker Notes

- `docker-compose.yml` currently defines the `web` service.
- Database/Redis services are not enabled in the default compose file; run Postgres separately unless you add those services.

## License

Private repository.

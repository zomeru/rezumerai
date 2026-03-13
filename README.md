# Rezumerai

Rezumerai is an AI-assisted resume builder for job seekers who want one workspace to draft, refine, tailor, and export resumes. It combines structured resume editing with AI-powered section optimization, job-description matching, and a scope-aware assistant that can answer public, account, or admin questions based on the current user's access.

- Monorepo: Turborepo + Bun workspaces
- App: Next.js 16 App Router + React 19 + embedded Elysia API
- Data: PostgreSQL + Prisma 7
- Auth: Better Auth
- AI: Vercel AI SDK + OpenRouter + pgvector-backed assistant memory

## Features

- Resume dashboard to create, search, rename, delete, and download saved resumes
- Guided resume builder for personal info, summary, experience, education, projects, and skills
- Four resume templates: `classic`, `modern`, `minimal`, and `minimal_image`
- Accent color and font-size controls with live HTML/PDF preview
- Rich-text editing for summary, experience, and project content
- Drag-and-drop reordering for experience, education, projects, and skills
- PDF export and full-page preview
- AI Resume Copilot for section optimization, job-description tailoring, and full resume review
- Streamed AI text optimization with daily credit tracking
- Built-in AI assistant with anonymous guest support, persisted thread history, and `PUBLIC` / `USER` / `ADMIN` scopes
- Better Auth accounts with email/password, GitHub OAuth, anonymous sessions, and admin roles
- Account settings for profile updates, password changes, AI model selection, and AI credit visibility
- Admin console for users, live AI model availability, system configuration, audit logs, analytics, and error logs
- Database-backed public content for the landing page, FAQ, about, contact, privacy, and terms pages

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TanStack Query for server state
- Zustand for UI/store state
- Tailwind CSS v4
- Tiptap rich-text editing
- `react-pdf`, `jspdf`, and `html2canvas-pro` for resume preview/export flows

### Backend

- Elysia embedded inside `apps/web`
- Next.js route bridge at `apps/web/src/app/api/[[...slugs]]/route.ts`
- Eden Treaty client for end-to-end typed API calls
- Zod and Elysia models for request/response validation

### Database

- PostgreSQL
- Prisma 7 with a modular schema in `packages/database/prisma/models`
- `pgvector`-backed assistant embedding storage

### Authentication

- Better Auth with Prisma adapter
- Email/password login
- GitHub OAuth
- Anonymous guest sessions for the assistant
- Admin role management via Better Auth's admin plugin

### AI Infrastructure

- Vercel AI SDK Core in the embedded Elysia API
- AI SDK UI hooks (`useChat`, `useCompletion`) on the frontend
- OpenRouter via `@openrouter/ai-sdk-provider`
- OpenRouter model discovery plus database-backed system configuration
- LangChain text splitters plus `pgvector` for assistant memory embeddings

### AI Prompt Configuration

- `AI_CONFIG` stores runtime AI prompts, models, and limits in the `SystemConfiguration` table.
- `ASSISTANT_SYSTEM_PROMPT` is reserved for chat assistant behavior and remains separate from optimization workflows.
- Resume Copilot uses dedicated prompt keys for `optimize`, `tailor`, and `review`.
- `/testsite` Text Optimizer uses `TEXT_OPTIMIZER_SYSTEM_PROMPT`, which is general-purpose text optimization only.
- Legacy `COPILOT_SYSTEM_PROMPT` and `OPTIMIZE_SYSTEM_PROMPT` values are normalized into the new keys at runtime and when saved through the admin System Configuration editor.

### Observability And Operations

- OpenTelemetry plugin for Elysia request traces
- Database-backed analytics events, audit logs, and error logs
- Optional BotID protection for mutating `/api/*` requests

### Monorepo Tooling

- Bun workspaces
- Turborepo task orchestration
- Biome for formatting and linting
- Changesets for package versioning and publishing workflows

## Prerequisites

- [Bun](https://bun.sh/) `1.3.x`
- PostgreSQL with `pgvector` support available for migrations
- GitHub OAuth credentials for local auth flows
- Docker (optional, for the current web-only container workflow)

## Quick Start

1. Install dependencies

```sh
bun install
```

2. Configure environment variables

```sh
cp .env.example .env.local
```

Core variables for local development:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Runtime PostgreSQL connection for the app, Prisma client, and assistant memory storage |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection for Prisma CLI commands such as `db push`, `migrate`, and `generate` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public app URL used by metadata, OpenRouter headers, and the Eden API client |
| `BETTER_AUTH_URL` | Yes | Better Auth server base URL |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing and encryption secret |
| `BETTER_AUTH_GITHUB_CLIENT_ID` | Yes | GitHub OAuth client ID |
| `BETTER_AUTH_GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth client secret |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for Copilot, assistant, and optimize-text flows |

Optional variables used by the current codebase or reserved in the env template:

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_GOOGLE_CLIENT_ID` | Optional placeholder in the env schema and template; the current auth config exposes GitHub only |
| `BETTER_AUTH_GOOGLE_CLIENT_SECRET` | Optional placeholder in the env schema and template; the current auth config exposes GitHub only |
| `CRON_SECRET` | Reserved in `.env.example` and Turbo env inputs for scheduled/background-job protection |
| `DB_SEED_USER_EMAIL` | Extra email to include when running `bun run db:seed` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint for OpenTelemetry trace export |
| `OTEL_EXPORTER_OTLP_HEADERS` | Comma-separated auth headers for the OTLP exporter |
| `SENTRY_DSN` | Optional env validated in `apps/web/src/env.ts`; no Sentry bootstrap is wired in the current app |
| `ANALYTICS_ID` | Optional env validated in `apps/web/src/env.ts`; no external analytics provider is wired in the current app |
| `AI_MEMORY_REINDEX_LIMIT` | Optional limit consumed by `bun run assistant:reindex-memory` |

3. Initialize database

```sh
bun run db:setup
```

Optional local reset/demo data:

```sh
bun run db:seed:system
bun run db:seed
```

4. Start development

```sh
bun run dev
```

Notes:

- Root `predev` builds `@rezumerai/database` before `turbo dev`.
- `apps/web` runs `scripts/download-pdf-worker.ts` on `predev` and `prebuild`.
- Deploy-oriented `bun run db:migrate` now bootstraps any missing required system configuration and public content rows after Prisma migrations.
- `bun run db:seed:system` is a development reset tool that rewrites AI/system configuration and public content back to the current defaults.
- `bun run db:seed` seeds dummy resumes for existing users; it does not create auth users.

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

Useful targeted commands:

```sh
bun run db:studio
bun run assistant:reindex-memory
```

Notes:

- Use Bun only; the repo is configured as a Bun workspace monorepo.
- `bun run check` syncs nested Biome config versions before running workspace checks.
- Workspace `check` scripts use Biome in write mode, so they can apply formatting fixes.

## Root Scripts

### Build and Run

| Script | Description |
| --- | --- |
| `bun run dev` | Start monorepo dev tasks with `turbo dev` |
| `bun run start` | Start workspace `start` tasks |
| `bun run build` | Build all apps and packages |
| `bun run build:production` | Build all workspaces with `NODE_ENV=production` |
| `bun run build:packages` | Build only workspace packages under `packages/*` |

### Code Quality and Tests

| Script | Description |
| --- | --- |
| `bun run check` | Sync Biome versions, then run workspace `check` scripts |
| `bun run biome` | Run Biome from the repo root in write mode |
| `bun run update:biome-configs` | Update nested Biome config versions to match the root tool version |
| `bun run check:types` | Run workspace type checks |
| `bun run code:check` | Run `check` and `check:types` |
| `bun run test` | Run workspace tests |
| `bun run test:watch` | Run workspace tests in watch mode |
| `bun run test:coverage` | Run workspace tests with coverage |
| `bun run code:verify` | Run lint/format, type checks, tests, and build |

### Database

| Script | Description |
| --- | --- |
| `bun run db:setup` | Run `db:push` and `db:generate` in `packages/database` |
| `bun run db:generate` | Generate Prisma client and Prismabox artifacts |
| `bun run db:push` | Push the Prisma schema to the configured database |
| `bun run db:migrate` | Deploy Prisma migrations and bootstrap missing required system configuration rows |
| `bun run db:migrate:dev` | Create and apply a development migration |
| `bun run db:migrate:status` | Show Prisma migration status |
| `bun run db:bootstrap:system` | Create any missing required system configuration and public content rows without overwriting existing values |
| `bun run db:pull` | Pull schema changes from the database |
| `bun run db:seed:system` | Reset AI/system configuration and public content rows back to the current defaults |
| `bun run db:seed` | Seed dummy resume data for existing users |
| `bun run assistant:reindex-memory` | Run the assistant memory reindex script |
| `bun run db:psql` | Open `psql` against `DATABASE_URL` |
| `bun run db:inspect-vectors` | Inspect recent assistant embedding rows |
| `bun run db:studio` | Open Prisma Studio on port `5556` |
| `bun run db:reset` | Force-reset the database with Prisma migrate reset |

### Release and Packages

| Script | Description |
| --- | --- |
| `bun run changeset` | Create a Changesets release entry |
| `bun run version:packages` | Build packages, then apply Changesets version bumps |
| `bun run publish:packages` | Publish packages with Changesets |

### Docker and Maintenance

| Script | Description |
| --- | --- |
| `bun run docker:build` | Build and start Docker Compose services using `.env.local` |
| `bun run docker:build:standalone` | Build the standalone web Docker image from `apps/web/Dockerfile` |
| `bun run docker:up` | Start Docker Compose services |
| `bun run docker:down` | Stop Docker Compose services |
| `bun run start:redis` | Attempt to start a `redis` compose service if you add one |
| `bun run ai:superpowers` | Refresh the repo-local `superpowers` skill bundle and Claude symlink |
| `bun run install:modules` | Install dependencies and rebuild workspace packages |
| `bun run update:modules:1` | Run the repository dependency update helper script |
| `bun run update:modules:2` | Upgrade dependencies with Bun's latest update commands |
| `bun run clean` | Remove build, cache, coverage, and install artifacts |
| `bun run clean:install` | Clean, reinstall dependencies, and rebuild workspace packages |
| `bun run outdated` | Show outdated dependencies |
| `bun run security:audit` | Run Bun's production dependency audit |
| `bun run security:check` | Run `audit-ci` with the repository config |
| `bun run prepare` | Install Husky Git hooks |

## Architecture Overview

### Next.js App Router + API Bridge

- UI routes live under `apps/web/src/app`.
- `apps/web/src/app/api/[[...slugs]]/route.ts` forwards `/api/*` requests into the embedded Elysia app.
- `apps/web/src/app/api/auth/[...all]/route.ts` is the dedicated Better Auth handler.
- `apps/web/src/proxy.ts` enforces route protection, admin gating, redirects, and security/CSP headers for non-API requests.

### Elysia API Composition

- `apps/web/src/elysia-api/app.ts` is the API entrypoint and single composition root.
- Security and infrastructure are registered first: OpenTelemetry, trace logging, observability, Helmet, CORS, rate limiting in production, CSRF, Prisma, request logging, and centralized error handling.
- Dev-only Swagger and OpenAPI docs are enabled in development.
- `GET /api/health` provides a basic health check.
- A daily cron job cleans up expired error logs.

### API Modules

- `user`: authenticated user/account endpoints
- `resume`: resume CRUD and search
- `ai`: assistant chat/messages, model settings, Copilot actions, and streamed text optimization
- `admin`: users, AI models, system configuration, audit logs, analytics, and error log management

### Module Structure

- `index.ts` defines routes and transport concerns
- `model.ts` defines Elysia models and route contracts
- `service.ts` owns business logic and orchestration
- `repository.ts` is used where Prisma access is non-trivial
- AI-specific integrations live under `controller/`, `memory/`, `prompts/`, `providers/`, and `tools/`

### Shared Packages

- `@rezumerai/database`: Prisma client, schema modules, migrations, and seeds
- `@rezumerai/types`: shared Zod schemas and TypeScript contracts for AI, resume, user, admin, error, and content domains
- `@rezumerai/utils`: shared date, string, React, UUID, and style helpers
- `@rezumerai/ui`: shared UI primitives, auth form components, and skeletons
- `@rezumerai/tsconfig`: shared TypeScript configuration presets

## Repository Layout

```txt
apps/
  web/
    src/
      app/
        about/
        admin/
        api/
          [[...slugs]]/
          auth/[...all]/
        contact/
        faq/
        preview/[resumeId]/
        privacy/
        signin/
        signup/
        terms/
        workspace/
          builder/[resumeId]/
          settings/
      components/
      constants/
      elysia-api/
        modules/
          admin/
          ai/
          resume/
          user/
        observability/
        plugins/
      hooks/
      lib/
      providers/
      store/
      templates/
      test/
      env.ts
      proxy.ts
    scripts/
packages/
  database/
    prisma/
      migrations/
      models/
    scripts/
  types/
    src/
      admin/
      ai/
      content/
      error/
      resume/
      user/
  ui/
    src/
      components/
  utils/
    src/
  tsconfig/
.agents/
  instructions/
  skills/
docs/
  plans/
scripts/
.github/
```

## Conventions

- Use Bun for package management, scripts, and tests.
- Use Biome for formatting and linting; the root config lives in `biome.json`.
- Prefer shared schemas from `@rezumerai/types` and validate boundaries with Zod/Elysia models.
- Keep shared logic in `@rezumerai/database`, `@rezumerai/types`, `@rezumerai/utils`, or `@rezumerai/ui` instead of duplicating app-local code.
- Use `ROUTES` from `apps/web/src/constants/routing.ts` instead of hardcoded route strings.
- Keep Elysia feature modules organized around `index.ts`, `model.ts`, `service.ts`, and `repository.ts` where needed.
- Keep tests colocated in `__tests__` when that pattern already exists.
- Use `bun test`; React/component tests run with React Testing Library and Happy DOM in the packages/apps that declare Bun test preload config.

## Docker Notes

- The repository includes Docker assets for the `web` app only.
- `docker-compose.yml` currently enables only the `web` service by default.
- The PostgreSQL service is present only as commented reference configuration.
- The Docker helper scripts load secrets from `.env.local`.
- `apps/web/Dockerfile` builds Next.js standalone output for the web app.
- The root `Dockerfile` is a placeholder; use `apps/web/Dockerfile` for the actual application image.
- `start:redis` exists as a helper script, but the default compose file does not define a `redis` service.

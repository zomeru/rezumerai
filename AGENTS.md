# AI Agent Instructions for Rezumerai

`AGENTS.md` is the canonical AI guidance file in this repository. `CLAUDE.md` should remain a symlink to this file.

## 1. Startup Checklist (Run Every Task)

1. Activate Serena for this project.
2. Discover skills by listing `.agents/skills/`.
3. Open `SKILL.md` for any skill that matches the task before making changes.
4. Inspect current code/scripts first; do not assume docs are up-to-date.

### Required commands

```sh
ls .agents/skills/
cat .agents/skills/<skill-name>/SKILL.md
```

## 2. Monorepo Overview

Rezumerai is an AI-powered resume builder using Bun workspaces and Turborepo.

### Workspaces

- `apps/web`: Next.js 16 App Router frontend with embedded Elysia API
- `packages/database`: Prisma schema, migrations, generated client, seed scripts
- `packages/types`: shared Zod schemas and TS types (`resume`, `user`, `ai`)
- `packages/utils`: shared utilities (`date`, `string`, `styles`, `uuid`, `react`, `schema-validation`)
- `packages/ui`: shared UI components/styles
- `packages/tsconfig`: shared TS config presets

## 3. Architecture (Current Implementation)

### Web + API composition

- UI and API are deployed through `apps/web`.
- API entrypoint is `apps/web/src/elysia-api/app.ts`.
- Next.js catch-all route `apps/web/src/app/api/[[...slugs]]/route.ts` forwards to Elysia.
- Better Auth handler lives at `apps/web/src/app/api/auth/[...all]/route.ts`.

### Elysia modules/plugins

Current modules:

- `apps/web/src/elysia-api/modules/user`
- `apps/web/src/elysia-api/modules/resume`
- `apps/web/src/elysia-api/modules/ai`

Current plugin files:

- `auth.ts`, `prisma.ts`, `error.ts`, `logger.ts`, `modernCsrf.ts`, `opentelemetry.ts`, `trace.ts`, `compress.ts`

### Client API and routing

- Eden treaty client is in `apps/web/src/lib/api.ts`.
- Route constants are centralized in `apps/web/src/constants/routing.ts`.
- Use `ROUTES` constants instead of hardcoded paths.

### Auth and request protection

- Better Auth config: `apps/web/src/lib/auth.ts`.
- Route protection/security headers/CSP: `apps/web/src/proxy.ts`.

## 4. App Structure Reference

```txt
apps/web/src/
  app/
    api/[[...slugs]]/
    api/auth/[...all]/
    signin/
    signup/
    preview/[resumeId]/
    workspace/
      builder/[resumeId]/
      settings/
  elysia-api/
    app.ts
    modules/{ai,resume,user}
    plugins/
  components/
    Dashboard/
    Home/
    ResumeBuilder/
    ui/
  hooks/
  lib/
  providers/
  store/
  templates/
  constants/
  env.ts
  proxy.ts
```

## 5. Tooling and Workflow

## Package manager/runtime

- Use Bun only.
- Do not use npm, yarn, or pnpm.

## Core scripts (root)

```sh
bun install
bun run dev
bun run build
bun run check
bun run check:types
bun run test
bun run code:verify
```

## Database scripts (root passthrough)

```sh
bun run db:setup
bun run db:generate
bun run db:push
bun run db:migrate
bun run db:migrate:dev
bun run db:migrate:status
bun run db:seed
bun run db:seed:ai
bun run db:pull
bun run db:studio
bun run db:reset
```

## Docker scripts

```sh
bun run docker:build
bun run docker:build:standalone
bun run docker:up
bun run docker:down
```

Note: default `docker-compose.yml` currently defines only the `web` service. Database/Redis services are not enabled by default.

## 6. Environment Variables

Primary variables used by current implementation:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SITE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_GITHUB_CLIENT_ID`
- `BETTER_AUTH_GITHUB_CLIENT_SECRET`
- `OPENROUTER_API_KEY`

Optional:

- `BETTER_AUTH_GOOGLE_CLIENT_ID`
- `BETTER_AUTH_GOOGLE_CLIENT_SECRET`
- `CRON_SECRET`
- `REDIS_URL`
- `SENTRY_DSN`
- `ANALYTICS_ID`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`

Validation source: `apps/web/src/env.ts`.

## 7. Coding Conventions

## Language/style

- TypeScript-first across all packages/apps.
- Biome is the formatter/linter (`biome.json` at root).
- Formatting defaults: 2 spaces, 120 columns, double quotes.
- Tailwind classes are sorted via Biome (`useSortedClasses`).

## Type checking

- Strict mode is enabled in root/web/database/types configs.
- `packages/ui` and `packages/utils` currently use `strict: false` in shared tsconfig presets.
- Prefer explicit return types, but this is not globally enforced by root Biome rules today.

## Naming and organization

- React components: PascalCase files/components.
- Hooks: camelCase with `use` prefix.
- Zustand stores: `use*Store`.
- API modules: feature folders with `index.ts`, `model.ts`, `service.ts`.

## Reuse rules

- Prefer shared types from `@rezumerai/types`.
- Prefer shared utils from `@rezumerai/utils`.
- Prefer shared UI from `@rezumerai/ui` when applicable.
- Avoid duplicate app-local utilities/types when shared package extensions are appropriate.

## 8. Testing Conventions

- Test runner: Bun (`bun test`).
- React/component tests: React Testing Library + Happy DOM preload.
- Current bun test preload config exists in:
  - `apps/web/bunfig.toml`
  - `packages/ui/bunfig.toml`
  - `packages/utils/bunfig.toml`
- Keep tests colocated in `__tests__` directories where patterns already exist.

## 9. Task Completion Checks

For implementation changes, run:

```sh
bun run check
bun run check:types
bun run test
bun run build
```

Or run the aggregate command:

```sh
bun run code:verify
```

If schema/model changes were made, include:

```sh
bun run db:generate
# and/or
bun run db:migrate:dev
```

## 10. Test Accounts for AI Browser Testing (Playwright MCP, etc...)
USER ROLE:
Email: `test@test.com`
Password: `Test1234`

ADMIN ROLE:
Email: `testadmin@test.com`
Password: `Test1234`


## 11. Agent Do/Do Not

## Do

- Read matching skills before coding.
- Align changes with current file layout and scripts.
- Use `ROUTES` constants for navigation paths.
- Keep docs and code consistent when workflow changes.

## Do Not

- Use package managers other than Bun.
- Hardcode route strings when `ROUTES` exists.
- Introduce `any` without strong justification.
- Assume docs are authoritative over source code.

---

Update this file when architecture, scripts, or conventions change.

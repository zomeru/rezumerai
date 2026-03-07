# Rezumerai AGENTS.md

This file is the canonical guide for AI coding agents working in this repository. `CLAUDE.md` must remain a symlink to this file.

## Scope And Precedence

- This file applies repo-wide unless a deeper `AGENTS.md` exists closer to the file being changed.
- Follow instructions in this order: direct user request, nearest `AGENTS.md`, parent `AGENTS.md`.
- Verify behavior against code, scripts, and config before changing anything. Docs can lag behind implementation.
- Update this file in the same change when architecture, scripts, conventions, or agent workflows change.

## Agent Startup Checklist

Run this checklist at the start of every task:

1. Activate Serena for this project.
2. Discover local skills by listing `.agents/skills/`.
3. Open `SKILL.md` for every skill that matches the task before editing.
4. Inspect the relevant code, scripts, and config first.
5. Check for a nearer `AGENTS.md` if you are working outside the repo root.

Required commands:

```sh
ls .agents/skills/
cat .agents/skills/<skill-name>/SKILL.md
```

## Project Overview

Rezumerai is an AI-powered resume builder organized as a Bun workspace monorepo with Turborepo. The main application lives in `apps/web`, which serves both the Next.js frontend and an embedded Elysia API.

### Main Technologies

- Bun `1.3.x` for package management, runtime, and tests
- Turborepo `2.x` for workspace orchestration
- Next.js `16` App Router with React `19`
- Elysia for the API layer
- Better Auth for authentication
- Prisma `7` with PostgreSQL
- Zod for shared schemas
- Zustand and TanStack Query on the frontend
- Tailwind CSS `4`
- Biome for formatting and linting
- React Testing Library with Happy DOM

### Repository Layout

- `apps/web`: Next.js app, embedded Elysia API, auth routes, UI, state, templates
- `packages/database`: Prisma schema, migrations, generated client, seed scripts
- `packages/types`: shared Zod schemas and TypeScript types
- `packages/utils`: shared utilities
- `packages/ui`: shared UI components and styles
- `packages/tsconfig`: shared TypeScript presets
- `.agents/skills`: repository-local agent skills
- `.github/agents`: GitHub agent prompt files
- `scripts`: root automation and maintenance scripts

### High-Value Paths

- API entrypoint: `apps/web/src/elysia-api/app.ts`
- Next.js to Elysia bridge: `apps/web/src/app/api/[[...slugs]]/route.ts`
- Better Auth handler: `apps/web/src/app/api/auth/[...all]/route.ts`
- Auth config: `apps/web/src/lib/auth.ts`
- Request protection, security headers, and CSP: `apps/web/src/proxy.ts`
- Eden treaty client: `apps/web/src/lib/api.ts`
- Route constants: `apps/web/src/constants/routing.ts`
- Env validation: `apps/web/src/env.ts`

Current Elysia modules:

- `apps/web/src/elysia-api/modules/user`
- `apps/web/src/elysia-api/modules/resume`
- `apps/web/src/elysia-api/modules/ai`

Current Elysia plugins:

- `auth.ts`
- `prisma.ts`
- `error.ts`
- `logger.ts`
- `modernCsrf.ts`
- `opentelemetry.ts`
- `trace.ts`
- `compress.ts`

Reference structure:

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
  hooks/
  lib/
  providers/
  store/
  templates/
  constants/
packages/
  database/
  types/
  ui/
  utils/
  tsconfig/
.agents/skills/
.github/agents/
```

## Development Workflow

### Environment Requirements

- Use Bun only. Do not use npm, yarn, or pnpm.
- Most app and database work expects a local PostgreSQL instance.
- Root env files are used by workspace scripts. Start from `.env.example` and populate `.env.local`.
- Additional env variants exist for preview and production workflows: `.env.preview.local`, `.env.production.local.backup`.
- Default `docker-compose.yml` currently defines only the `web` service. Database and Redis are not enabled there by default.

Primary env vars used by the current implementation:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SITE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_GITHUB_CLIENT_ID`
- `BETTER_AUTH_GITHUB_CLIENT_SECRET`
- `OPENROUTER_API_KEY`

Optional env vars:

- `BETTER_AUTH_GOOGLE_CLIENT_ID`
- `BETTER_AUTH_GOOGLE_CLIENT_SECRET`
- `CRON_SECRET`
- `REDIS_URL`
- `SENTRY_DSN`
- `ANALYTICS_ID`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`

Source of truth for env validation: `apps/web/src/env.ts`.

### Setup

```sh
bun install
bun run db:setup
bun run dev
```

Notes:

- `bun run dev` runs the root `predev` hook, which builds `@rezumerai/database` first.
- `apps/web` runs `scripts/download-pdf-worker.ts` on `predev` and `prebuild`.
- Workspace-local commands should still be run with Bun from the relevant package directory.

## Build, Lint, Format, And Test Commands

### Root Commands

```sh
bun install
bun run dev
bun run build
bun run build:production
bun run build:packages
bun run start
bun run check
bun run biome
bun run check:types
bun run code:check
bun run test
bun run test:watch
bun run test:coverage
bun run code:verify
```

Important behavior:

- `bun run check` runs `update:biome-configs` first, then `turbo check`.
- `bun run biome` and many workspace `check` scripts write formatting fixes in place.
- `bun run code:verify` is the main full-repo verification command.

### Database Commands

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

### Docker Commands

```sh
bun run docker:build
bun run docker:build:standalone
bun run docker:up
bun run docker:down
```

### Useful Maintenance Commands

```sh
bun run install:modules
bun run update:modules
bun run clean
bun run clean:install
bun run outdated
bun run security:audit
bun run security:check
```

## Code Style And Conventions

### General

- TypeScript-first across the repo.
- Biome is the formatter and linter. Root config lives in `biome.json`.
- Formatting defaults: spaces, 2-space indentation, 120-column width, double quotes.
- Tailwind classes are sorted through Biome `useSortedClasses`.
- Prefer explicit types when they improve clarity. Do not introduce `any` without a strong reason.
- Match the conventions already used in the touched file before introducing a new pattern.

### Naming And Organization

- React components: PascalCase files and component names
- Hooks: camelCase with `use` prefix
- Zustand stores: `use*Store`
- API modules: feature folders with `index.ts`, `model.ts`, `service.ts`
- Use `ROUTES` constants instead of hardcoded route strings
- Prefer shared code from `@rezumerai/types`, `@rezumerai/utils`, and `@rezumerai/ui` over app-local duplication

### TypeScript Expectations

- Strict mode is enabled in the root, web, database, and types configs.
- `packages/ui` and `packages/utils` currently inherit shared presets with `strict: false`.
- Do not assume shared packages are fully strict when refactoring types.

### Files To Avoid Editing Manually

- Generated outputs such as `.next/`, `.turbo/`, `dist/`, and `coverage/`
- Prisma generated client output under `packages/database/generated/`
- Lockstep artifacts unless the related source changed in the same task

## Testing Guidelines

### Frameworks And Locations

- Test runner: Bun (`bun test`)
- React and component tests: React Testing Library with Happy DOM preload
- Current Bun test preload config lives in:
  - `apps/web/bunfig.toml`
  - `packages/ui/bunfig.toml`
  - `packages/utils/bunfig.toml`
- Keep tests colocated in `__tests__` directories where that pattern already exists
- CI workflow reference: `.github/workflows/main.yml`

### Default Verification For Code Changes

For implementation changes, run:

```sh
bun run check
bun run check:types
bun run test
bun run build
```

Or run:

```sh
bun run code:verify
```

If schema or model changes were made, also run:

```sh
bun run db:generate
# and/or
bun run db:migrate:dev
```

### Browser Testing

Use the existing development server on port `3000` for browser automation, including Playwright MCP.

Development test accounts:

- User email: `test@test.com`
- User password: `Test1234`
- Admin email: `testadmin@test.com`
- Admin password: `Test1234`

Notes:

- Ensure the dev server is running before browser tests.
- These credentials are for local automated testing and role-based validation only.

## AI Agent Instructions

### How To Explore The Codebase

- Start with the startup checklist in this file.
- Prefer inspecting scripts, package manifests, workflows, and the touched source before trusting docs.
- Prefer `rg` and `rg --files` for search.
- Use the minimum set of matching skills needed for the task.
- When a skill applies, read its `SKILL.md` first and only load additional references that are actually needed.
- Resolve skill-relative paths from the skill directory first.

### How To Modify Code Safely

- Keep changes scoped to the task. Do not refactor unrelated areas opportunistically.
- Preserve existing architecture boundaries between `apps/web` and shared packages.
- Use `ROUTES` constants for navigation and routing.
- Regenerate artifacts instead of hand-editing generated output when possible.
- If behavior, scripts, or architecture change, update docs and this file in the same change.
- Do not assume docs are authoritative over source code.

### Agent Assets In This Repository

- Local skills: `.agents/skills/<skill-name>/SKILL.md`
- GitHub agent prompts: `.github/agents/*.agent.md`
- Root compatibility link: `CLAUDE.md -> AGENTS.md`

### Do

- Read matching skills before coding.
- Align changes with the current file layout and existing scripts.
- Reuse shared packages where appropriate.
- Keep docs and code consistent when workflow changes.

### Do Not

- Use package managers other than Bun.
- Hardcode route strings when `ROUTES` exists.
- Introduce `any` without strong justification.
- Assume docs are more accurate than the implementation.

## Security Considerations

- Never commit real secrets or rotate credentials in `.env*` files unless the task explicitly requires it.
- Treat `.env.local`, `.env.preview.local`, and `.env.production.local.backup` as sensitive.
- Authentication and request protection changes require extra care:
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/app/api/auth/[...all]/route.ts`
  - `apps/web/src/proxy.ts`
  - `apps/web/src/elysia-api/plugins/modernCsrf.ts`
- Database and schema changes require extra care:
  - `packages/database/prisma/**`
  - `packages/database/generated/**`
- Do not weaken auth, CSRF, CSP, rate limiting, role checks, or env validation without an explicit reason and accompanying verification.
- Keep secrets in env files, not in source, tests, fixtures, or agent prompts.

## Commit And Pull Request Guidelines

### Commits

- Prefer concise, imperative commit subjects.
- Conventional prefixes such as `feat:`, `fix:`, and `chore:` are common in this repo and preferred when they fit.
- Keep commits focused. Include code, docs, schema, and generated artifacts together when they are part of the same logical change.
- If a package release or published package surface changes, use Changesets when the task calls for versioning work.

### Pull Requests

- Summarize the user-visible or developer-visible impact.
- List the workspaces and major paths changed.
- Call out env, auth, schema, migration, or generated-client changes explicitly.
- Include the commands you ran, or state what you could not run.
- Include screenshots or short recordings for meaningful UI changes.

### Code Review Expectations

- Prioritize correctness, regressions, security, and missing tests.
- Review changes in the context of workspace boundaries and shared package reuse.
- Prefer small, reviewable diffs over broad cleanup.

## Monorepo And Nested AGENTS.md Guidance

- The root `AGENTS.md` governs the repository by default.
- A deeper `AGENTS.md` closer to the edited file takes precedence for that subtree.
- Keep nested files focused on local workflow, commands, and conventions. Do not duplicate all root guidance.
- If a package or app gains unique instructions, add a local `AGENTS.md` there instead of overloading the root file.
- Agents should always prioritize the nearest `AGENTS.md` in the directory tree.
- Current state: there is no package-level `AGENTS.md` under `apps/` or `packages/`. Existing nested `AGENTS.md` files inside `.agents/skills/` apply only to those skill directories.

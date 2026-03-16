# Development Workflow

## Environment Requirements

- Use Bun only. Do not use npm, yarn, or pnpm.
- Most app and database work expects a local PostgreSQL instance.
- Root env files are used by workspace scripts. Start from `.env.example` and populate `.env.local`.
- Additional env variants exist for preview and production workflows: `.env.preview.local`, `.env.production.local.backup`.
- Default `docker-compose.yml` currently defines only the `web` service. Database and Redis are not enabled there by default.

## Primary Env Vars

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SITE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_GITHUB_CLIENT_ID`
- `BETTER_AUTH_GITHUB_CLIENT_SECRET`
- `OPENROUTER_API_KEY`

## Optional Env Vars

- `BETTER_AUTH_GOOGLE_CLIENT_ID`
- `BETTER_AUTH_GOOGLE_CLIENT_SECRET`
- `CRON_SECRET`
- `DB_SEED_USER_EMAIL`
- `SENTRY_DSN`
- `ANALYTICS_ID`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `AI_MEMORY_REINDEX_LIMIT`

Source of truth for env validation: `apps/web/src/env.ts`.

## Setup

Use `rtk` for all commands to minimize terminal verbosity and preserve agent context tokens.

```sh
rtk bun install
rtk bun run db:setup
rtk bun run dev
```

### Notes

- `rtk bun run dev` runs the root `predev` hook, which builds `@rezumerai/database` first.
- `apps/web` runs `scripts/download-pdf-worker.ts` on `predev` and `prebuild`.
- `rtk bun run db:migrate` bootstraps missing required AI/system configuration and public content rows after Prisma migrations.
- `rtk bun run db:seed:system` is the local reset path that rewrites those rows back to the current defaults.
- Workspace-local commands should still be run with Bun from the relevant package directory.

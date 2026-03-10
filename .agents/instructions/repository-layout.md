# Repository Layout

## Package Structure

- `apps/web`: Next.js app, embedded Elysia API, auth routes, UI, state, templates
- `packages/database`: Prisma schema, migrations, generated client, seed scripts
- `packages/types`: shared Zod schemas and TypeScript types
- `packages/utils`: shared utilities
- `packages/ui`: shared UI components and styles
- `packages/tsconfig`: shared TypeScript presets
- `.agents/skills`: repository-local agent skills
- `.github/agents`: GitHub agent prompt files
- `scripts`: root automation and maintenance scripts

## High-Value Paths

- API entrypoint: `apps/web/src/elysia-api/app.ts`
- Next.js to Elysia bridge: `apps/web/src/app/api/[[...slugs]]/route.ts`
- Better Auth handler: `apps/web/src/app/api/auth/[...all]/route.ts`
- Auth config: `apps/web/src/lib/auth.ts`
- Request protection, security headers, and CSP: `apps/web/src/proxy.ts`
- Eden treaty client: `apps/web/src/lib/api.ts`
- Route constants: `apps/web/src/constants/routing.ts`
- Env validation: `apps/web/src/env.ts`

## Current Elysia Modules

- `apps/web/src/elysia-api/modules/admin`
- `apps/web/src/elysia-api/modules/user`
- `apps/web/src/elysia-api/modules/resume`
- `apps/web/src/elysia-api/modules/ai`

## Current Elysia Plugins

- `auth.ts`
- `prisma.ts`
- `error.ts`
- `logger.ts`
- `modernCsrf.ts`
- `opentelemetry.ts`
- `trace.ts`
- `compress.ts`

## Reference Directory Structure

```txt
apps/web/src/
  app/
    admin/
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
    modules/{admin,ai,resume,user}
    observability/
    plugins/
  components/
  hooks/
  lib/
  providers/
  store/
  templates/
  test/
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

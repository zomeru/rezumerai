# Security Guidelines

- Never commit real secrets or rotate credentials in `.env*` files unless the task explicitly requires it.
- Treat `.env.local`, `.env.preview.local`, and `.env.production.local.backup` as sensitive.

## Files Requiring Extra Care

### Authentication And Request Protection

- `apps/web/src/lib/auth.ts`
- `apps/web/src/app/api/auth/[...all]/route.ts`
- `apps/web/src/proxy.ts`
- `apps/web/src/elysia-api/plugins/modernCsrf.ts`

### Database And Schema

- `packages/database/prisma/**`
- `packages/database/generated/**`

## Rules

- Do not weaken auth, CSRF, CSP, rate limiting, role checks, or env validation without an explicit reason and accompanying verification.
- Keep secrets in env files, not in source, tests, fixtures, or agent prompts.

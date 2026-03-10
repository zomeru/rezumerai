# Elysia API Guidelines

## Composition Root

- The embedded API lives in `apps/web/src/elysia-api/`.
- `apps/web/src/elysia-api/app.ts` is the single composition root for plugins, cron jobs, and modules.
- Next.js forwards `/api/*` requests to Elysia through `apps/web/src/app/api/[[...slugs]]/route.ts`.
- Do not add parallel API handlers when a route belongs in the Elysia app.

## Current Modules

- `admin`
- `ai`
- `resume`
- `user`

## Plugin Order Matters

When editing `app.ts`, preserve the current layering:

1. Observability and tracing
2. Security middleware (`helmet`, CORS, rate limit, CSRF)
3. Core infrastructure (`prisma`, logger)
4. Error handling
5. Dev-only docs
6. Auth + feature modules

Changing this order can break request context, error capture, or route protection.

## Route And Module Patterns

- Keep route handlers thin. Transport concerns belong in `index.ts`.
- Put Elysia models and route contracts in `model.ts`.
- Put orchestration and business logic in `service.ts`.
- Use `repository.ts` when Prisma access is non-trivial.
- Keep module-local DTOs, helpers, and types inside the module instead of leaking app-specific logic into shared packages.

## Auth And Access

- Protected modules use `authPlugin`, which injects `user` into the Elysia context.
- `/api/ai/assistant/chat` and `/api/ai/assistant/history` are intentionally auth-optional at the plugin level because the assistant supports anonymous sessions.
- Admin access is enforced inside the `admin` module; do not bypass its local role gate.

## Observability And Errors

- Reuse the existing observability, audit, and error plugins instead of ad hoc logging.
- Preserve request context propagation when adding middleware or background jobs.
- Keep handled API failures returning consistent status bodies instead of throwing raw errors at the edge.

## Frontend Integration

- The frontend uses Eden Treaty from `apps/web/src/lib/api.ts` for typed calls into Elysia.
- Prefer extending the shared Elysia app types instead of hand-writing duplicate client DTOs.

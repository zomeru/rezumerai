# Next.js App Router Guidelines

## Current App Router Surface

- The Next.js app lives in `apps/web/src/app`.
- Public routes: `/`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`
- Auth routes: `/signin`, `/signup`
- Session-gated routes: `/workspace`, `/workspace/builder/[resumeId]`, `/workspace/settings`, `/preview/[resumeId]`, `/text-optimizer`
- Admin routes: `/admin/**`
- Session-gated utility route: `/text-optimizer`

## Server And Client Boundaries

- Default to Server Components for route pages and layouts unless the page needs browser-only APIs, local interaction state, or client hooks.
- Use `"use client"` for interactive shells such as the workspace dashboard, builder, settings, assistant widget, and admin client pages.
- Keep heavy route-level data loading on the server where possible.

## Data Fetching Patterns

- When a Server Component needs authenticated API data, call the Eden client and forward request headers with `headers()` so Better Auth cookies reach Elysia.
- See `apps/web/src/app/workspace/builder/[resumeId]/page.tsx` and `apps/web/src/app/preview/[resumeId]/page.tsx` for the current pattern.
- Public content pages should read `apps/web/src/lib/system-content.ts` directly on the server instead of duplicating fetch logic.

## API Boundary

- `apps/web/src/app/api/[[...slugs]]/route.ts` is the transport-only bridge from Next.js to the embedded Elysia app.
- `apps/web/src/app/api/auth/[...all]/route.ts` is the dedicated Better Auth transport.
- Do not add separate Next.js route handlers for application API features that belong in Elysia modules.

## Layout, Routing, And Protection

- `apps/web/src/app/layout.tsx` owns global metadata, providers, the `AiAssistantWidget`, and the shared `Toaster`.
- `apps/web/src/proxy.ts` owns route protection, admin gating, auth-page redirects, and security/CSP headers for non-API requests.
- If you add or rename protected routes, update `proxy.ts` and `apps/web/src/constants/routing.ts` together.
- Use `ROUTES` constants instead of hardcoded href strings.

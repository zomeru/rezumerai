# Middleware / Proxy Patterns

## BREAKING CHANGE: Next.js 16

In Next.js 16, `middleware.ts` is renamed to `proxy.ts`:

| Version | File | Function | Runtime |
|---------|------|----------|---------|
| Next.js 15 | `middleware.ts` | `middleware()` | Edge or Node |
| Next.js 16+ | `proxy.ts` | `proxy()` | Node.js only |

### Migration (Next.js 15 → 16)

```bash
# Automatic migration
npx @next/codemod middleware-to-proxy
```

```typescript
// BEFORE: middleware.ts (Next.js 15)
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

// AFTER: proxy.ts (Next.js 16)
export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}
```

**Note**: Edge runtime is NOT supported in `proxy.ts`. Use Node.js runtime only.

---

## Overview

Middleware/Proxy runs BEFORE the request is completed. Use for:
- Authentication/authorization
- Redirects and rewrites
- Headers manipulation
- A/B testing
- Geolocation-based routing

## Basic Structure

### Next.js 15 (middleware.ts)

```typescript
// middleware.ts (root of project)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Your logic
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

### Next.js 16+ (proxy.ts)

```typescript
// proxy.ts (root of project)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // Your logic - Node.js runtime only
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

## Runtime (Version-Specific)

### Next.js 15

```typescript
// Edge Runtime (default) - faster, limited APIs
export const runtime = "edge"

// Node.js Runtime - full Node APIs
export const runtime = "nodejs"
```

**Edge limitations**: No fs, no native Node modules, limited crypto

### Next.js 16+

```typescript
// Node.js runtime ONLY - no configuration needed
// Edge runtime is NOT supported in proxy.ts
```

## Authentication: Deny by Default

```typescript
import { auth } from "@/lib/auth"

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/health",
]

const adminRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Allow public routes
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // 2. Check authentication
  const session = await auth()

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Check admin routes
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  return NextResponse.next()
}
```

## Redirects

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Simple redirect
  if (pathname === "/old-page") {
    return NextResponse.redirect(new URL("/new-page", request.url))
  }

  // Permanent redirect (301)
  if (pathname === "/legacy") {
    return NextResponse.redirect(new URL("/modern", request.url), 301)
  }

  // Conditional redirect
  const country = request.geo?.country || "US"
  if (pathname === "/store" && country === "UK") {
    return NextResponse.redirect(new URL("/store/uk", request.url))
  }

  return NextResponse.next()
}
```

## Rewrites (Internal URL Change)

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // A/B test - same URL, different content
  if (pathname === "/pricing") {
    const variant = request.cookies.get("ab_variant")?.value || "a"
    return NextResponse.rewrite(new URL(`/pricing/${variant}`, request.url))
  }

  // Multi-tenant
  const host = request.headers.get("host")
  if (host?.startsWith("docs.")) {
    return NextResponse.rewrite(new URL(`/docs${pathname}`, request.url))
  }

  return NextResponse.next()
}
```

## Headers Manipulation

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add request ID
  const requestId = crypto.randomUUID()
  response.headers.set("x-request-id", requestId)

  // Security headers
  response.headers.set("X-Frame-Options", "DENY")

  // CORS
  if (request.nextUrl.pathname.startsWith("/api")) {
    response.headers.set("Access-Control-Allow-Origin", "https://app.example.com")
  }

  return response
}
```

## Matcher Patterns

```typescript
export const config = {
  matcher: [
    // Single route
    "/dashboard",

    // Route with params
    "/blog/:slug",

    // All routes except static
    "/((?!_next/static|_next/image|favicon.ico).*)",

    // API routes only
    "/api/:path*",

    // Multiple specific paths
    ["/dashboard/:path*", "/admin/:path*"],
  ],
}
```

## Rate Limiting in Middleware

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
})

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    const ip = request.ip ?? "127.0.0.1"
    const { success, remaining } = await ratelimit.limit(ip)

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "X-RateLimit-Remaining": remaining.toString() },
      })
    }
  }

  return NextResponse.next()
}
```

## Geolocation-Based Routing

```typescript
export function middleware(request: NextRequest) {
  const country = request.geo?.country
  const city = request.geo?.city
  const region = request.geo?.region

  // Block certain countries
  if (country === "XX") {
    return new NextResponse("Unavailable in your region", { status: 451 })
  }

  // Regional redirect
  if (country === "DE" && !request.nextUrl.pathname.startsWith("/de")) {
    return NextResponse.redirect(new URL("/de", request.url))
  }

  // Pass geo to components
  const response = NextResponse.next()
  response.headers.set("x-country", country || "unknown")
  return response
}
```

## IMPORTANT: Don't Rely on Middleware Alone

Middleware can be bypassed (CVE-2025-29927). Always validate at data layer:

```typescript
// middleware.ts - First line of defense
export async function middleware(request: NextRequest) {
  const session = await auth()
  if (!session) redirect("/login")
}

// But ALSO check in Server Actions and API routes
export async function updateUser(data: FormData) {
  "use server"
  const session = await auth() // Double-check here too
  if (!session) throw new Error("Unauthorized")
  // ...
}
```

## Anti-Patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| Allow by default | Security risk | Deny by default, allowlist public |
| Heavy computation | Blocks request | Keep middleware fast |
| Database queries | Slow, may timeout | Use edge caching or defer |
| Trust only middleware | Can be bypassed | Validate at data layer too |
| Huge matcher regex | Hard to maintain | Explicit route lists |
| Node APIs in Edge | Will crash | Use nodejs runtime if needed |

## Debugging

```typescript
export function middleware(request: NextRequest) {
  console.log("Middleware:", {
    pathname: request.nextUrl.pathname,
    method: request.method,
    headers: Object.fromEntries(request.headers),
  })

  return NextResponse.next()
}
```

Check server logs or Vercel function logs for output.
 # Security for Next.js

## CRITICAL: Version Requirements

- **Minimum**: Next.js 15.2.3+ (CVE-2025-29927 fix)
- **Auth.js**: v5+ (NextAuth v5)

## 7-Step Server Action Security

Every Server Action MUST follow this flow:

```typescript
"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { revalidateTag } from "next/cache"
import { logAudit } from "@/lib/audit"

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
})

export async function createPost(formData: FormData) {
  // 1. RATE LIMIT (prevent abuse)
  await rateLimit("createPost", { limit: 10, window: "1m" })

  // 2. AUTHENTICATION (verify session)
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // 3. VALIDATION (sanitize input, don't log raw data)
  let validated
  try {
    validated = CreatePostSchema.parse({
      title: formData.get("title"),
      content: formData.get("content"),
    })
  } catch (e) {
    throw new Error("Invalid input") // Don't expose Zod errors
  }

  // 4. AUTHORIZATION (IDOR prevention)
  // For updates/deletes, verify ownership:
  // const post = await db.posts.findUnique({ where: { id } })
  // if (post.authorId !== session.user.id) throw new Error("Forbidden")

  // 5. MUTATION
  const post = await db.posts.create({
    data: {
      ...validated,
      authorId: session.user.id,
    },
  })

  // 6. GRANULAR CACHE INVALIDATION
  revalidateTag(`user-${session.user.id}-posts`)

  // 7. AUDIT LOG (async, don't block response)
  logAudit({
    action: "createPost",
    userId: session.user.id,
    resourceId: post.id,
  }).catch(console.error)

  return { success: true, id: post.id }
}
```

## OWASP Mitigations

| Risk | Mitigation |
|------|------------|
| A01: Broken Access Control | Step 4 - Authorization check |
| A02: Cryptographic Failures | Use HTTPS, secure cookies |
| A03: Injection | Step 3 - Zod validation |
| A04: Insecure Design | Step 1 - Rate limiting |
| A05: Security Misconfiguration | Security headers in next.config |
| A07: Auth Failures | Step 2 - Session verification |
| A09: Logging Failures | Step 7 - Audit log |

## Rate Limiting Pattern

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
})

export async function rateLimit(
  identifier: string,
  options?: { limit?: number; window?: string }
) {
  const { success, remaining } = await ratelimit.limit(identifier)

  if (!success) {
    throw new Error("Rate limit exceeded")
  }

  return { remaining }
}
```

## Middleware Security

### Deny by Default

```typescript
// middleware.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// EXPLICITLY list public routes
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/health",
  "/api/auth",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Require auth for everything else
  const session = await auth()
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

### NEVER Rely on Middleware Alone

Middleware runs at edge, can be bypassed. Always validate at data layer:

```typescript
// lib/auth-check.ts
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session.user
}

// In Server Action or API route
const user = await requireAuth()
```

## Security Headers (next.config.ts)

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

export default {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}
```

## Server Actions: allowedOrigins

For apps behind proxies:

```typescript
// next.config.ts
export default {
  experimental: {
    serverActions: {
      allowedOrigins: ["app.example.com", "staging.example.com"],
    },
  },
}
```

## Auth.js v5 Pattern

```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    authorized({ auth, request }) {
      return !!auth?.user
    },
  },
})

// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers

// In Server Component
import { auth } from "@/lib/auth"

export default async function Page() {
  const session = await auth()
  if (!session) redirect("/login")
  return <Dashboard user={session.user} />
}
```

## Anti-Patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| Trust client data | Can be forged | Always validate server-side |
| Log raw form input | Data leaks | Sanitize before logging |
| Skip auth in actions | Actions are public endpoints | Check auth in EVERY action |
| Use revalidatePath('/') | Exposes all routes to cache storm | Use granular revalidateTag |
| Hardcode secrets | Leaks in build | Use env vars |
| Skip rate limiting | DoS vulnerability | Rate limit all mutations |

## Zombie Actions Prevention

When removing features, delete the Server Action export:

```typescript
// DANGER: UI removed but action still callable
export async function deleteAccount(userId: string) {
  // Still exploitable!
}

// SAFE: Delete the entire function when feature removed
```
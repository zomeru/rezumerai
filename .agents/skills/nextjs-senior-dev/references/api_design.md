# API Design

## When to Use API Routes

| Scenario | Use API Route? | Alternative |
|----------|---------------|-------------|
| External webhooks | Yes | - |
| Third-party integrations | Yes | - |
| Public API for others | Yes | - |
| Internal data fetching | No | Server Components |
| Form submissions | No | Server Actions |
| Mutations from client | No | Server Actions |

## REST API Routes

### Basic CRUD

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db/client"
import { z } from "zod"

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

// GET /api/posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const published = searchParams.get("published") === "true"

  const posts = await db.post.findMany({
    where: { published },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  })

  const total = await db.post.count({ where: { published } })

  return NextResponse.json({
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const validated = createPostSchema.safeParse(body)

  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.flatten() },
      { status: 400 }
    )
  }

  const post = await db.post.create({
    data: {
      ...validated.data,
      authorId: session.user.id,
    },
  })

  return NextResponse.json({ data: post }, { status: 201 })
}
```

### Dynamic Routes

```typescript
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db/client"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/posts/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const post = await db.post.findUnique({
    where: { id },
    include: { author: { select: { name: true, image: true } } },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json({ data: post })
}

// PATCH /api/posts/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Check ownership
  const post = await db.post.findUnique({ where: { id } })
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }
  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await db.post.update({
    where: { id },
    data: body,
  })

  return NextResponse.json({ data: updated })
}

// DELETE /api/posts/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const post = await db.post.findUnique({ where: { id } })
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }
  if (post.authorId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db.post.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
```

## API Versioning

### URL-Based Versioning

```
app/
├── api/
│   ├── v1/
│   │   └── posts/
│   │       └── route.ts
│   └── v2/
│       └── posts/
│           └── route.ts
```

### Header-Based Versioning

```typescript
// app/api/posts/route.ts
export async function GET(request: NextRequest) {
  const version = request.headers.get("api-version") || "1"

  if (version === "2") {
    return handleV2(request)
  }

  return handleV1(request)
}
```

## Error Handling

### Consistent Error Response

```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} not found`)
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, "UNAUTHORIZED", "Authentication required")
  }
}

export class ForbiddenError extends ApiError {
  constructor() {
    super(403, "FORBIDDEN", "Access denied")
  }
}

export class ValidationError extends ApiError {
  constructor(details: unknown) {
    super(400, "VALIDATION_ERROR", "Validation failed", details)
  }
}
```

### Error Handler Wrapper

```typescript
// lib/api/handler.ts
import { NextRequest, NextResponse } from "next/server"
import { ApiError } from "./errors"
import { ZodError } from "zod"

type Handler = (request: NextRequest, context?: any) => Promise<NextResponse>

export function withErrorHandler(handler: Handler): Handler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error("[API_ERROR]", error)

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          { status: error.statusCode }
        )
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              details: error.flatten(),
            },
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
          },
        },
        { status: 500 }
      )
    }
  }
}

// Usage
export const GET = withErrorHandler(async (request) => {
  throw new NotFoundError("Post")
})
```

## Rate Limiting

```typescript
// lib/api/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
})

export async function withRateLimit(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const key = identifier || ip

  const { success, limit, reset, remaining } = await ratelimit.limit(key)

  if (!success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    )
  }

  return null // Continue
}

// Usage in route
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  // Handle request
}
```

## Authentication Middleware

```typescript
// lib/api/auth.ts
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function withAuth(
  request: NextRequest,
  requiredRole?: string
): Promise<{ session: Session } | NextResponse> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    )
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
      { status: 403 }
    )
  }

  return { session }
}

// Usage
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const result = await withAuth(request, "admin")
  if (result instanceof NextResponse) return result

  const { session } = result
  // Now session is guaranteed to exist with admin role
}
```

## tRPC Integration

### Setup

```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod
```

### Server Setup

```typescript
// server/trpc/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server"
import { auth } from "@/auth"

export const createTRPCContext = async () => {
  const session = await auth()

  return {
    session,
    db,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  })
})
```

### Router Definition

```typescript
// server/trpc/routers/posts.ts
import { z } from "zod"
import { router, publicProcedure, protectedProcedure } from "../trpc"

export const postsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.db.post.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      })

      let nextCursor: string | undefined
      if (posts.length > input.limit) {
        const nextItem = posts.pop()
        nextCursor = nextItem?.id
      }

      return { posts, nextCursor }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          ...input,
          authorId: ctx.session.user.id,
        },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input.id } })

      if (!post || post.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      return ctx.db.post.delete({ where: { id: input.id } })
    }),
})
```

### App Router

```typescript
// server/trpc/routers/_app.ts
import { router } from "../trpc"
import { postsRouter } from "./posts"
import { usersRouter } from "./users"

export const appRouter = router({
  posts: postsRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
```

### API Route Handler

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/trpc/routers/_app"
import { createTRPCContext } from "@/server/trpc/trpc"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
```

### Client Setup

```typescript
// lib/trpc/client.ts
"use client"

import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@/server/trpc/routers/_app"

export const trpc = createTRPCReact<AppRouter>()
```

### Provider

```typescript
// app/providers.tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { useState } from "react"
import { trpc } from "@/lib/trpc/client"

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

### Usage in Components

```typescript
// features/posts/components/PostList.interactive.tsx
"use client"

import { trpc } from "@/lib/trpc/client"

export function PostList() {
  const { data, isLoading, fetchNextPage, hasNextPage } =
    trpc.posts.list.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )

  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      trpc.useUtils().posts.list.invalidate()
    },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.pages.flatMap((page) =>
        page.posts.map((post) => <PostCard key={post.id} post={post} />)
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  )
}
```

## Webhooks

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session)
      break

    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdate(subscription)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

## API Documentation

### OpenAPI with next-swagger-doc

```typescript
// lib/api/swagger.ts
import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = () => {
  return createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "My API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  })
}

// app/api/docs/route.ts
import { getApiDocs } from "@/lib/api/swagger"

export async function GET() {
  return Response.json(getApiDocs())
}
```

## API Design Best Practices

| Practice | Example |
|----------|---------|
| Use nouns for resources | `/api/posts` not `/api/getPosts` |
| Use HTTP methods correctly | GET (read), POST (create), PATCH (update), DELETE |
| Return appropriate status codes | 200, 201, 204, 400, 401, 403, 404, 500 |
| Paginate list endpoints | `?page=1&limit=10` or cursor-based |
| Version your API | `/api/v1/posts` |
| Validate all input | Zod schemas |
| Use consistent error format | `{ error: { code, message, details } }` |
| Document your API | OpenAPI/Swagger |

## API Checklist

- [ ] Authentication on protected routes
- [ ] Authorization (ownership, roles)
- [ ] Input validation with Zod
- [ ] Rate limiting
- [ ] Consistent error responses
- [ ] Proper HTTP status codes
- [ ] Pagination for list endpoints
- [ ] API versioning strategy
- [ ] Webhook signature verification
- [ ] Request/response logging
- [ ] API documentation

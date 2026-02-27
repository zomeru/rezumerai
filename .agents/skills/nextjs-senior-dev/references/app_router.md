# App Router Patterns

## Folder Structure

```
app/
├── (marketing)/          # Route group (no URL segment)
│   ├── layout.tsx        # Marketing layout
│   └── page.tsx          # /
├── (dashboard)/
│   ├── layout.tsx        # Dashboard layout
│   └── settings/
│       └── page.tsx      # /settings
├── @modal/               # Parallel route slot
│   └── (.)post/[id]/     # Intercepting route
│       └── page.tsx
├── api/
│   └── [...slug]/
│       └── route.ts      # Catch-all API
└── layout.tsx            # Root layout (required)
```

## Route Groups `(name)`

Organize routes without affecting URL:

```
app/
├── (auth)/
│   ├── layout.tsx     # Centered, no nav
│   ├── login/page.tsx # /login
│   └── register/page.tsx
├── (main)/
│   ├── layout.tsx     # With nav + sidebar
│   └── dashboard/page.tsx
```

## Dynamic Routes

| Pattern | Example | Matches |
|---------|---------|---------|
| `[id]` | `/blog/[id]` | `/blog/1` |
| `[...slug]` | `/docs/[...slug]` | `/docs/a/b/c` |
| `[[...slug]]` | `/shop/[[...slug]]` | `/shop` or `/shop/a/b` |

```typescript
// app/blog/[id]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // Next.js 15: params is Promise
  return <Post id={id} />
}

// Generate static params
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ id: post.id }))
}
```

## Parallel Routes `@slot`

Render multiple pages simultaneously:

```
app/
├── @analytics/
│   └── page.tsx
├── @team/
│   └── page.tsx
├── layout.tsx      # Receives { analytics, team } as props
└── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <>
      {children}
      <aside>{analytics}</aside>
      <aside>{team}</aside>
    </>
  )
}
```

## Intercepting Routes

Open modals while preserving URL context:

| Pattern | Intercepts |
|---------|-----------|
| `(.)` | Same level |
| `(..)` | One level up |
| `(..)(..)` | Two levels up |
| `(...)` | From root |

```
app/
├── @modal/
│   ├── default.tsx           # No modal state
│   └── (.)photo/[id]/
│       └── page.tsx          # Modal view of photo
├── photo/[id]/
│   └── page.tsx              # Full page view
└── layout.tsx
```

## Special Files

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI (makes route accessible) |
| `layout.tsx` | Shared UI, preserves state |
| `template.tsx` | Like layout, re-renders on navigation |
| `loading.tsx` | Loading UI (Suspense boundary) |
| `error.tsx` | Error boundary |
| `not-found.tsx` | 404 UI |
| `route.ts` | API endpoint |
| `default.tsx` | Parallel route fallback |

## Route Handlers (API)

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') ?? '1'

  const posts = await db.posts.findMany({
    skip: (parseInt(page) - 1) * 10,
    take: 10,
  })

  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Validate, create, return
  return NextResponse.json({ id: 1 }, { status: 201 })
}
```

## Metadata

```typescript
// Static
export const metadata: Metadata = {
  title: 'My App',
  description: 'Description',
}

// Dynamic
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  return { title: post.title }
}
```

## Colocation

Keep related files together:

```
app/dashboard/
├── _components/     # Private (not routes)
│   └── Chart.tsx
├── _actions/        # Server Actions
│   └── update.ts
├── _lib/            # Utilities
│   └── utils.ts
├── page.tsx
└── layout.tsx
```

`_` prefix excludes from routing.
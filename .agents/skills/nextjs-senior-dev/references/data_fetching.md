# Data Fetching & Caching

## CRITICAL: Next.js 15 Change

**Next.js 15**: `fetch()` is UNCACHED by default
**Next.js 14**: `fetch()` was CACHED by default

Always be explicit about caching strategy.

## Strategy Decision Tree

```
Static at build time?
  └─ YES → generateStaticParams + fetch
Changes infrequently?
  └─ YES → ISR: fetch(url, { next: { revalidate: 60 }})
User-specific or always fresh?
  └─ YES → fetch(url, { cache: 'no-store' })
Need real-time in browser?
  └─ YES → Client fetch (SWR/React Query)
Mixed static + dynamic?
  └─ YES → Partial Prerendering
```

## Server Component Fetching

### Static (Build Time)

```typescript
// Runs at build time, output cached
export default async function Page() {
  const posts = await fetch('https://api.example.com/posts', {
    cache: 'force-cache', // Explicit static caching
  }).then(r => r.json())

  return <PostList posts={posts} />
}
```

### ISR (Incremental Static Regeneration)

```typescript
export default async function Page() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  }).then(r => r.json())

  return <PostList posts={posts} />
}
```

### Dynamic (No Cache)

```typescript
export default async function Page() {
  const data = await fetch('https://api.example.com/user', {
    cache: 'no-store', // Always fresh
  }).then(r => r.json())

  return <UserProfile data={data} />
}
```

### With Tags (For On-Demand Revalidation)

```typescript
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }, // Tag for targeted revalidation
}).then(r => r.json())

// In Server Action:
import { revalidateTag } from 'next/cache'
revalidateTag('posts') // Invalidate all fetches with this tag
```

## Direct Database Access

```typescript
// No fetch needed - direct DB in Server Component
import { db } from '@/lib/db'

export default async function Page() {
  const posts = await db.posts.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return <PostList posts={posts} />
}
```

## Client Fetching (SWR)

For real-time or user-initiated data:

```typescript
"use client"

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function LivePosts() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/posts',
    fetcher,
    { refreshInterval: 5000 } // Poll every 5s
  )

  if (isLoading) return <Skeleton />
  if (error) return <Error />

  return (
    <>
      <button onClick={() => mutate()}>Refresh</button>
      <PostList posts={data} />
    </>
  )
}
```

## Streaming with Suspense

Don't block the whole page for slow data:

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Header /> {/* Renders immediately */}

      <Suspense fallback={<PostsSkeleton />}>
        <Posts /> {/* Streams when ready */}
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments /> {/* Independent stream */}
      </Suspense>
    </div>
  )
}

// Slow data component
async function Posts() {
  const posts = await fetch('/api/posts', {
    cache: 'no-store',
  }).then(r => r.json())

  return <PostList posts={posts} />
}
```

## Parallel Data Fetching

Avoid waterfalls - fetch in parallel:

```typescript
export default async function Page() {
  // WRONG: Sequential (waterfall)
  const user = await getUser()
  const posts = await getPosts() // Waits for user

  // RIGHT: Parallel
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts(),
  ])

  return <Dashboard user={user} posts={posts} />
}
```

## Caching Layers

| Layer | Scope | Duration | Invalidation |
|-------|-------|----------|--------------|
| Request Memoization | Single render | Request lifetime | Automatic |
| Data Cache | Server | Persistent | revalidatePath/Tag |
| Full Route Cache | Server | Persistent | Rebuild, revalidate |
| Router Cache | Client | Session (30s) | router.refresh() |

## Cache Invalidation

### Path-Based (Broad - Avoid)

```typescript
import { revalidatePath } from 'next/cache'

revalidatePath('/posts') // Revalidates /posts and children
revalidatePath('/posts', 'layout') // Include layouts
revalidatePath('/') // DANGER: Revalidates everything
```

### Tag-Based (Granular - Preferred)

```typescript
import { revalidateTag } from 'next/cache'

// When fetching:
fetch(url, { next: { tags: ['posts', `post-${id}`] }})

// When mutating:
revalidateTag('posts') // All posts
revalidateTag(`post-${id}`) // Specific post
```

## Route Segment Config

```typescript
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force static
export const dynamic = 'force-static'

// Revalidate interval
export const revalidate = 60

// Runtime
export const runtime = 'edge' // or 'nodejs'
```

## Anti-Patterns

| Don't | Do |
|-------|-----|
| `useEffect` for initial data | Server Component async |
| API routes for server data | Direct DB in RSC |
| `revalidatePath('/')` | Granular `revalidateTag()` |
| Sequential fetches | `Promise.all()` |
| Block whole page | Streaming w/ Suspense |
| Client fetch for static data | Server fetch w/ cache |
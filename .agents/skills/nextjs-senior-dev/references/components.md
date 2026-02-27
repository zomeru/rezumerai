# Server & Client Components

## Decision Tree

```
Need browser APIs? (window, localStorage, navigator)
  └─ YES → Client Component
  └─ NO → Need useState/useEffect/useReducer?
              └─ YES → Client Component
              └─ NO → Need event handlers? (onClick, onChange)
                         └─ YES → Client Component
                         └─ NO → Server Component ✓
```

## Server Components (Default)

When to use:
- Data fetching
- Access backend resources directly
- Keep sensitive info on server (tokens, API keys)
- Large dependencies (don't ship to client)
- No interactivity needed

```typescript
// app/dashboard/page.tsx - Server Component
export default async function Dashboard() {
  // Direct database access - no API needed
  const user = await db.users.findUnique({ where: { id: userId }})
  const stats = await analytics.getStats(userId)

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <Stats data={stats} />
    </div>
  )
}
```

## Client Components

When to use:
- `useState`, `useEffect`, `useReducer`
- Event handlers (onClick, onChange, onSubmit)
- Browser APIs (window, localStorage, geolocation)
- Custom hooks with state
- Class components

```typescript
// components/Counter.interactive.tsx
"use client"

import { useState } from "react"

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

## Composition Pattern

Server Components can import Client Components (not vice versa):

```typescript
// app/page.tsx (Server)
import { Counter } from "@/components/Counter.interactive"
import { getInitialData } from "@/lib/data"

export default async function Page() {
  const data = await getInitialData() // Server-side fetch

  return (
    <div>
      <h1>Server Rendered</h1>
      <Counter initialValue={data.count} /> {/* Client island */}
    </div>
  )
}
```

## Pass Server Data to Client

```typescript
// app/posts/page.tsx (Server)
import { PostList } from "./PostList.interactive"

export default async function Page() {
  const posts = await db.posts.findMany() // Server fetch

  return <PostList initialPosts={posts} /> // Pass as props
}

// app/posts/PostList.interactive.tsx
"use client"

export function PostList({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  // Client-side interactivity
}
```

## Third-Party Libraries

Most npm packages aren't RSC-ready. Create facade:

```typescript
// lib/motion.tsx
"use client"

export { motion, AnimatePresence } from "framer-motion"
```

```typescript
// app/page.tsx (Server)
import { motion } from "@/lib/motion" // Works!

export default function Page() {
  return <motion.div animate={{ opacity: 1 }} />
}
```

## Context Providers

Wrap at appropriate level (often root layout):

```typescript
// app/providers.tsx
"use client"

import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class">
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}

// app/layout.tsx (Server)
import { Providers } from "./providers"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Anti-Patterns

### DON'T: "use client" at top of tree

```typescript
// WRONG - Makes entire app client-rendered
// app/layout.tsx
"use client" // ❌
export default function RootLayout({ children }) {...}
```

### DO: Push boundary down

```typescript
// RIGHT - Only interactive parts are client
// app/layout.tsx (Server by default)
import { Nav } from "./Nav.interactive"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Nav /> {/* Only Nav is client */}
        {children}
      </body>
    </html>
  )
}
```

### DON'T: Import Server into Client

```typescript
// WRONG - Will error
"use client"
import { ServerOnlyComponent } from "./ServerOnly"
```

### DO: Pass as children

```typescript
// app/page.tsx (Server)
import { ClientWrapper } from "./ClientWrapper.interactive"
import { ServerContent } from "./ServerContent"

export default function Page() {
  return (
    <ClientWrapper>
      <ServerContent /> {/* Works via children */}
    </ClientWrapper>
  )
}
```

## File Naming Convention

| Suffix | Type | Contains |
|--------|------|----------|
| `.tsx` | Server (default) | async, data fetch |
| `.interactive.tsx` | Client | "use client", state, events |
| `.ui.tsx` | Either | Pure presentation |
| `.action.ts` | Server Action | "use server", mutations |
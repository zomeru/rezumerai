# Shared Components & DRY Patterns

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     components/ui/                          │
│  Pure primitives: Button, Input, Card, Badge, Avatar        │
│  No business logic, fully configurable via props            │
├─────────────────────────────────────────────────────────────┤
│                   components/shared/                        │
│  Compound components: Navbar, Footer, Modal, DataTable      │
│  May have some app-specific styling, still reusable         │
├─────────────────────────────────────────────────────────────┤
│                features/[name]/components/                  │
│  Feature-specific: LoginForm, InvoiceList, ProjectCard      │
│  Contains business logic, uses shared components            │
├─────────────────────────────────────────────────────────────┤
│                  app/[route]/_components/                   │
│  Route-specific: DashboardWidget, SettingsPanel             │
│  Used only by that specific route                           │
└─────────────────────────────────────────────────────────────┘
```

## When to Create Shared Components

### Create Shared When:

| Signal | Example |
|--------|---------|
| Used in 3+ places | Button, Card, Avatar |
| Pure presentation | No fetch, no business logic |
| Highly configurable | Variants, sizes, states |
| Design system part | Consistent styling required |

### Keep Feature-Specific When:

| Signal | Example |
|--------|---------|
| Single feature use | `InvoiceStatusBadge` |
| Contains business logic | `SubscriptionCard` |
| Feature-specific types | `ProjectMemberList` |
| Likely to diverge | Different needs per feature |

## Composition Patterns

### The "Hole" Pattern (RSC + Client)

Preserve Server Components inside Client wrappers:

```tsx
// components/shared/Sidebar.interactive.tsx
"use client"

import { useState } from "react"

interface SidebarProps {
  children: React.ReactNode  // The "hole" for server content
  defaultOpen?: boolean
}

export function Sidebar({ children, defaultOpen = true }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <aside className={isOpen ? "w-64" : "w-16"}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {children} {/* Server Components stay server! */}
    </aside>
  )
}

// app/(app)/layout.tsx (Server)
import { Sidebar } from "@/components/shared/Sidebar.interactive"
import { NavLinks } from "./NavLinks" // Server Component

export default function AppLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar>
        <NavLinks /> {/* ✅ Stays Server Component */}
      </Sidebar>
      <main>{children}</main>
    </div>
  )
}
```

### Compound Components

Build flexible APIs with composition:

```tsx
// components/ui/card.tsx
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-lg border bg-card shadow-sm", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: CardProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-2xl font-semibold", className)} {...props} />
  )
}

function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

function CardFooter({ className, ...props }: CardProps) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }

// Usage
<Card>
  <CardHeader>
    <CardTitle>Project Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Configure your project...</p>
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Render Props for Flexibility

```tsx
// components/shared/DataList.tsx
interface DataListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  emptyState?: React.ReactNode
  loading?: boolean
}

export function DataList<T>({
  items,
  renderItem,
  emptyState = <p>No items</p>,
  loading,
}: DataListProps<T>) {
  if (loading) return <Skeleton />
  if (items.length === 0) return emptyState

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i}>{renderItem(item, i)}</li>
      ))}
    </ul>
  )
}

// Usage
<DataList
  items={users}
  renderItem={(user) => <UserCard user={user} />}
  emptyState={<EmptyUsers />}
/>
```

## DRY Patterns

### 1. Reusable Server Actions

Create a secure action builder:

```typescript
// lib/safe-action.ts
import { z } from "zod"
import { auth } from "@/lib/auth"
import { revalidateTag } from "next/cache"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

interface ActionOptions {
  rateLimit?: { limit: number; window: string }
  revalidateTags?: string[]
}

export function createSafeAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (data: TInput, userId: string) => Promise<TOutput>,
  options: ActionOptions = {}
) {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    "use server"

    try {
      // 1. Rate limit
      if (options.rateLimit) {
        // await rateLimit(options.rateLimit)
      }

      // 2. Auth
      const session = await auth()
      if (!session?.user) {
        return { success: false, error: "Unauthorized" }
      }

      // 3. Validate
      const result = schema.safeParse(input)
      if (!result.success) {
        return {
          success: false,
          error: "Validation failed",
          fieldErrors: result.error.flatten().fieldErrors,
        }
      }

      // 4. Execute
      const data = await handler(result.data, session.user.id)

      // 5. Revalidate
      options.revalidateTags?.forEach(revalidateTag)

      return { success: true, data }
    } catch (error) {
      console.error("[ACTION_ERROR]", error)
      return { success: false, error: "Something went wrong" }
    }
  }
}

// Usage
const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

export const createPost = createSafeAction(
  createPostSchema,
  async (data, userId) => {
    return db.posts.create({ data: { ...data, authorId: userId } })
  },
  { revalidateTags: ["posts"] }
)
```

### 2. Shared Data Fetching

```typescript
// lib/fetchers.ts
import { cache } from "react"

// Memoized for single request (deduplication)
export const getUser = cache(async (userId: string) => {
  return db.users.findUnique({ where: { id: userId } })
})

// With error handling
export async function fetchWithError<T>(
  fetcher: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await fetcher()
  } catch (error) {
    console.error(errorMessage, error)
    throw new Error(errorMessage)
  }
}

// Usage
export const getProject = cache(async (projectId: string) => {
  return fetchWithError(
    () => db.projects.findUniqueOrThrow({ where: { id: projectId } }),
    `Project ${projectId} not found`
  )
})
```

### 3. Shared Layouts

```tsx
// app/(app)/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/shared/navbar"
import { Sidebar } from "@/components/shared/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen">
      <Navbar user={session.user} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
```

### 4. Reusable Hooks

```typescript
// hooks/use-action.ts
"use client"

import { useState, useTransition } from "react"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function useAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>
) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const execute = async (input: TInput) => {
    setError(null)

    return new Promise<TOutput>((resolve, reject) => {
      startTransition(async () => {
        const result = await action(input)
        if (result.success) {
          resolve(result.data)
        } else {
          setError(result.error)
          reject(new Error(result.error))
        }
      })
    })
  }

  return { execute, isPending, error }
}

// Usage
function CreatePostForm() {
  const { execute, isPending, error } = useAction(createPost)

  const onSubmit = async (data: FormData) => {
    try {
      await execute({ title: data.get("title"), content: data.get("content") })
      toast.success("Post created!")
    } catch {
      // Error already in state
    }
  }

  return (
    <form action={onSubmit}>
      {error && <p className="text-red-500">{error}</p>}
      <button disabled={isPending}>
        {isPending ? "Creating..." : "Create"}
      </button>
    </form>
  )
}
```

### 5. Shared Utilities

```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils/format.ts
export function formatDate(date: Date | string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(date))
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

// lib/utils/validation.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

## Anti-Patterns

### DON'T: Premature Abstraction

```tsx
// ❌ Creating a component for single use
// components/shared/DashboardHeaderWithUserAvatarAndNotifications.tsx
export function DashboardHeaderWithUserAvatarAndNotifications() { ... }

// ✅ Keep it in route folder until needed elsewhere
// app/dashboard/_components/Header.tsx
```

### DON'T: Over-Generic Props

```tsx
// ❌ Too many props, hard to use
interface ButtonProps {
  variant: "primary" | "secondary" | "tertiary" | "ghost" | "link" | "danger"
  size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  rounded: "none" | "sm" | "md" | "lg" | "full"
  shadow: "none" | "sm" | "md" | "lg"
  // ... 20 more props
}

// ✅ Sensible defaults, common variants
interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}
```

### DON'T: Cross-Feature Imports

```tsx
// ❌ Feature importing from another feature
// features/billing/components/UpgradePrompt.tsx
import { UserAvatar } from "@/features/auth/components/UserAvatar"

// ✅ Move shared component to components/
// components/shared/UserAvatar.tsx
```

### DON'T: Duplicate API Patterns

```typescript
// ❌ Repeating validation/auth in every action
export async function createPost(data: FormData) {
  "use server"
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const validated = schema.parse(...)
  // ...
}

export async function updatePost(data: FormData) {
  "use server"
  const session = await auth() // Duplicated
  if (!session) throw new Error("Unauthorized") // Duplicated
  const validated = schema.parse(...) // Duplicated
  // ...
}

// ✅ Use createSafeAction builder
export const createPost = createSafeAction(createPostSchema, handler)
export const updatePost = createSafeAction(updatePostSchema, handler)
```

## Decision Matrix

| Question | If Yes | If No |
|----------|--------|-------|
| Used in 3+ places? | Shared | Keep local |
| Contains business logic? | Feature-specific | Can be shared |
| Likely to diverge? | Feature-specific | Can be shared |
| Part of design system? | `components/ui/` | `components/shared/` |
| Only used in one route? | `_components/` | Consider sharing |
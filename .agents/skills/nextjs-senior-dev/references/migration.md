# Migration Guide

## Pages Router → App Router

### Key Differences

| Feature | Pages Router | App Router |
|---------|--------------|------------|
| Directory | `pages/` | `app/` |
| Routing | File-based | Folder-based |
| Components | Client by default | Server by default |
| Data fetching | `getServerSideProps`, `getStaticProps` | `async` components, `fetch` |
| Layouts | `_app.tsx`, `_document.tsx` | `layout.tsx` |
| Error handling | `_error.tsx` | `error.tsx` |
| Loading | Manual | `loading.tsx` |
| API | `pages/api/` | `app/api/route.ts` |

### Migration Strategy

1. **Coexist first** - Both routers can work together
2. **Migrate routes incrementally** - Start with simple pages
3. **Move layouts last** - After all pages are migrated
4. **Update data fetching** - Replace getServerSideProps/getStaticProps
5. **Convert API routes** - pages/api → app/api

### Step 1: Enable App Router

```typescript
// next.config.ts
const config: NextConfig = {
  // App Router is enabled by default in Next.js 13+
  // Both routers can coexist
}
```

### Step 2: Migrate Simple Pages

**Before (Pages Router):**

```typescript
// pages/about.tsx
export default function AboutPage() {
  return <div>About Us</div>
}
```

**After (App Router):**

```typescript
// app/about/page.tsx
export default function AboutPage() {
  return <div>About Us</div>
}
```

### Step 3: Migrate Data Fetching

**Before (getServerSideProps):**

```typescript
// pages/posts/[id].tsx
export async function getServerSideProps({ params }) {
  const post = await getPost(params.id)

  if (!post) {
    return { notFound: true }
  }

  return { props: { post } }
}

export default function PostPage({ post }) {
  return <article>{post.title}</article>
}
```

**After (Server Component):**

```typescript
// app/posts/[id]/page.tsx
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  return <article>{post.title}</article>
}
```

**Before (getStaticProps + getStaticPaths):**

```typescript
// pages/products/[slug].tsx
export async function getStaticPaths() {
  const products = await getAllProducts()
  return {
    paths: products.map((p) => ({ params: { slug: p.slug } })),
    fallback: "blocking",
  }
}

export async function getStaticProps({ params }) {
  const product = await getProduct(params.slug)
  return {
    props: { product },
    revalidate: 60,
  }
}
```

**After (generateStaticParams + ISR):**

```typescript
// app/products/[slug]/page.tsx
export async function generateStaticParams() {
  const products = await getAllProducts()
  return products.map((p) => ({ slug: p.slug }))
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  return <ProductDetail product={product} />
}

// Enable ISR
export const revalidate = 60
```

### Step 4: Migrate Layouts

**Before (_app.tsx):**

```typescript
// pages/_app.tsx
import type { AppProps } from "next/app"
import { SessionProvider } from "next-auth/react"
import Layout from "@/components/Layout"
import "@/styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  )
}
```

**After (layout.tsx):**

```typescript
// app/layout.tsx
import { SessionProvider } from "next-auth/react"
import "@/styles/globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <SessionProvider>
          <Layout>{children}</Layout>
        </SessionProvider>
      </body>
    </html>
  )
}
```

**Before (_document.tsx):**

```typescript
// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

**After (layout.tsx handles this):**

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// Metadata is now in a separate export
export const metadata = {
  icons: { icon: "/favicon.ico" },
}
```

### Step 5: Migrate API Routes

**Before:**

```typescript
// pages/api/posts/index.ts
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const posts = await getPosts()
    return res.status(200).json(posts)
  }

  if (req.method === "POST") {
    const post = await createPost(req.body)
    return res.status(201).json(post)
  }

  return res.status(405).json({ error: "Method not allowed" })
}
```

**After:**

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const posts = await getPosts()
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const post = await createPost(body)
  return NextResponse.json(post, { status: 201 })
}
```

### Step 6: Migrate Client Components

**Before (Pages Router - everything is client):**

```typescript
// pages/dashboard.tsx
import { useState, useEffect } from "react"

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setData)
  }, [])

  return <div>{data?.value}</div>
}
```

**After (Split Server/Client):**

```typescript
// app/dashboard/page.tsx (Server Component)
import { DashboardStats } from "./DashboardStats.interactive"

export default async function DashboardPage() {
  const initialData = await getStats() // Fetch on server

  return (
    <div>
      <h1>Dashboard</h1>
      <DashboardStats initialData={initialData} />
    </div>
  )
}

// app/dashboard/DashboardStats.interactive.tsx (Client Component)
"use client"

import { useState, useEffect } from "react"

export function DashboardStats({ initialData }) {
  const [data, setData] = useState(initialData)

  // Only poll for updates on client
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await fetch("/api/stats").then((r) => r.json())
      setData(fresh)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return <div>{data.value}</div>
}
```

## Next.js Version Upgrades

### 14 → 15 Changes

| Change | Migration |
|--------|-----------|
| `fetch` uncached by default | Add `{ cache: 'force-cache' }` for caching |
| `params`/`searchParams` are Promises | Add `await` when accessing |
| React 19 | Update hooks usage if needed |
| Turbopack stable | Enable in `next.config.ts` |

**Params Change:**

```typescript
// Next.js 14
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id
}

// Next.js 15
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

**Fetch Caching:**

```typescript
// Next.js 14 - cached by default
fetch(url)

// Next.js 15 - uncached by default
fetch(url)                          // Dynamic
fetch(url, { cache: 'force-cache' }) // Static
```

### 15 → 16 Changes (Preview)

| Change | Migration |
|--------|-----------|
| `middleware.ts` → `proxy.ts` | Rename file, function `middleware()` → `proxy()` |
| Node.js runtime only | Remove Edge runtime code |
| Cache Components | New caching primitive |

**Middleware Migration:**

```bash
npx @next/codemod middleware-to-proxy
```

```typescript
// Before: middleware.ts
export function middleware(request: NextRequest) { ... }

// After: proxy.ts
export function proxy(request: NextRequest) { ... }
```

## Codemod Tools

### Available Codemods

```bash
# List all codemods
npx @next/codemod --help

# Run specific codemod
npx @next/codemod <codemod-name> <path>

# Common codemods:
npx @next/codemod new-link .          # Update <Link> usage
npx @next/codemod next-image-to-legacy-image .
npx @next/codemod next-image-experimental .
npx @next/codemod built-in-next-font .
```

### Custom Migration Script

```typescript
// scripts/migrate-pages.ts
import { glob } from "glob"
import fs from "fs/promises"
import path from "path"

async function migrate() {
  const pages = await glob("pages/**/*.tsx", {
    ignore: ["pages/_app.tsx", "pages/_document.tsx", "pages/api/**"],
  })

  for (const page of pages) {
    // Calculate new path
    const relativePath = path.relative("pages", page)
    const newPath = path.join("app", relativePath.replace(".tsx", "/page.tsx"))

    // Create directory
    await fs.mkdir(path.dirname(newPath), { recursive: true })

    // Read and transform content
    let content = await fs.readFile(page, "utf-8")

    // Add basic transformations
    // (Real migration would need AST transformation)

    // Write to new location
    await fs.writeFile(newPath, content)
    console.log(`Migrated: ${page} → ${newPath}`)
  }
}

migrate()
```

## Common Migration Issues

### Issue: useRouter Changes

```typescript
// Pages Router
import { useRouter } from "next/router"
const router = useRouter()
router.query.id       // Query params
router.push("/about") // Navigate

// App Router
import { useRouter, useParams, useSearchParams } from "next/navigation"
const router = useRouter()
const params = useParams()        // Dynamic params
const searchParams = useSearchParams()  // Query params

params.id                         // Dynamic segment
searchParams.get("filter")        // Query param
router.push("/about")             // Navigate
```

### Issue: Head Component

```typescript
// Pages Router
import Head from "next/head"

export default function Page() {
  return (
    <>
      <Head>
        <title>My Page</title>
        <meta name="description" content="..." />
      </Head>
      <main>...</main>
    </>
  )
}

// App Router - use metadata export
export const metadata = {
  title: "My Page",
  description: "...",
}

export default function Page() {
  return <main>...</main>
}
```

### Issue: Dynamic Metadata

```typescript
// Pages Router
import Head from "next/head"

export async function getServerSideProps({ params }) {
  const post = await getPost(params.id)
  return { props: { post } }
}

export default function Page({ post }) {
  return (
    <>
      <Head>
        <title>{post.title}</title>
      </Head>
      <article>...</article>
    </>
  )
}

// App Router
export async function generateMetadata({ params }) {
  const { id } = await params
  const post = await getPost(id)
  return { title: post.title }
}

export default async function Page({ params }) {
  const { id } = await params
  const post = await getPost(id)
  return <article>...</article>
}
```

### Issue: getServerSideProps Context

```typescript
// Pages Router - full context
export async function getServerSideProps(context) {
  const { req, res, params, query, resolvedUrl } = context
  // Access cookies
  const token = req.cookies.token
  // Set headers
  res.setHeader("Cache-Control", "...")
}

// App Router - use specific imports
import { cookies, headers } from "next/headers"

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")

  const headersList = await headers()
  const userAgent = headersList.get("user-agent")
}
```

## Migration Checklist

### Before Starting

- [ ] Backup/branch your code
- [ ] Ensure tests are passing
- [ ] Document current behavior
- [ ] Plan incremental migration

### During Migration

- [ ] Move simple pages first
- [ ] Keep both routers working
- [ ] Test each migrated route
- [ ] Update data fetching patterns
- [ ] Mark client components explicitly

### After Migration

- [ ] Remove pages directory
- [ ] Clean up unused imports
- [ ] Update documentation
- [ ] Run full test suite
- [ ] Performance testing
- [ ] Monitor error rates

## Rollback Strategy

```json
// Keep pages router working during migration
// next.config.ts - both routers coexist automatically

// If issues arise:
// 1. Revert app/ changes
// 2. Pages router continues working
// 3. Fix issues
// 4. Re-migrate
```
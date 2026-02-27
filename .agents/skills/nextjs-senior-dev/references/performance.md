e# Performance Optimization

## Core Web Vitals Targets

| Metric | Target | What It Measures |
|--------|--------|------------------|
| LCP | <2.5s | Largest content render time |
| INP | <200ms | Interaction responsiveness |
| CLS | <0.1 | Visual stability |

## LCP Optimization

### Image Optimization

```typescript
import Image from "next/image"

// Hero image - prioritized
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority           // Preload, disable lazy loading
  placeholder="blur" // Show blur while loading
  blurDataURL="..."  // Base64 placeholder
/>

// Below fold - lazy loaded (default)
<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",           // Show fallback immediately
  variable: "--font-inter",  // CSS variable
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Preload Critical Assets

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  other: {
    "link": [
      { rel: "preload", href: "/hero.jpg", as: "image" },
      { rel: "preconnect", href: "https://api.example.com" },
    ],
  },
}
```

## INP Optimization

### Reduce Client JavaScript

```typescript
// Use Server Components (default)
export default async function Page() {
  const data = await fetchData() // No client JS for this
  return <StaticContent data={data} />
}

// Only use Client for interactivity
import { InteractiveWidget } from "./Widget.interactive"

export default function Page() {
  return (
    <div>
      <StaticHeader />
      <InteractiveWidget /> {/* Only this ships JS */}
    </div>
  )
}
```

### Dynamic Imports

```typescript
import dynamic from "next/dynamic"

// Heavy component - load on demand
const HeavyChart = dynamic(() => import("./Chart"), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-only if needed
})

// Modal - load when needed
const Modal = dynamic(() => import("./Modal"))

function Page() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)}>Open</button>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </>
  )
}
```

### Avoid Hydration Bottlenecks

```typescript
// WRONG: Blocks hydration
"use client"
function App() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
  return <div>{data}</div>
}

// RIGHT: Server-side data, minimal client JS
export default async function Page() {
  const data = await fetch('/api/data').then(r => r.json())
  return <div>{data}</div>
}
```

## CLS Prevention

### Always Set Dimensions

```typescript
// Images
<Image width={400} height={300} ... />

// Aspect ratio container
<div className="aspect-video relative">
  <Image fill ... />
</div>
```

### Reserve Space for Dynamic Content

```typescript
// Skeleton with fixed height
<div className="min-h-[200px]">
  {isLoading ? <Skeleton height={200} /> : <Content />}
</div>

// Ads/embeds
<div className="h-[250px]"> {/* Fixed height */}
  <AdComponent />
</div>
```

### Font Loading

```typescript
// next/font handles this automatically
const inter = Inter({ display: "swap" }) // FOUT over FOIT
```

## Streaming

Don't block page for slow data:

```typescript
import { Suspense } from "react"

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<PostsSkeleton />}>
        <SlowPosts />
      </Suspense>
      <Footer />
    </>
  )
}

async function SlowPosts() {
  const posts = await db.posts.findMany() // Slow query
  return <PostList posts={posts} />
}
```

### Loading UI Pattern

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  )
}
```

## Bundle Optimization

### Analyze Bundle

```bash
# Install analyzer
npm install @next/bundle-analyzer

# next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer({
  // config
})

# Run
ANALYZE=true npm run build
```

### Tree Shaking

```typescript
// WRONG: Imports entire library
import _ from "lodash"
_.debounce(fn, 300)

// RIGHT: Import only what you need
import debounce from "lodash/debounce"
debounce(fn, 300)
```

### Route Segment Config

```typescript
// Force static generation
export const dynamic = "force-static"

// Lazy-load route
export const experimental_ppr = true // Partial Prerendering
```

## Caching Strategy

```typescript
// Static data - cache forever
fetch(url, { cache: "force-cache" })

// Rarely changing - ISR
fetch(url, { next: { revalidate: 3600 } }) // 1 hour

// User-specific - no cache
fetch(url, { cache: "no-store" })
```

## Measurement

### reportWebVitals

```typescript
// app/layout.tsx
import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric)
    // Send to analytics
  })
  return null
}
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://example.com
      https://example.com/dashboard
    budgetPath: ./budget.json
```

## Parallel Data Fetching

Avoid waterfalls - fetch in parallel:

```typescript
// WRONG: Sequential (waterfall)
export default async function Page() {
  const user = await getUser()      // 200ms
  const posts = await getPosts()    // 300ms - waits for user
  const stats = await getStats()    // 150ms - waits for posts
  // Total: 650ms
}

// RIGHT: Parallel
export default async function Page() {
  const [user, posts, stats] = await Promise.all([
    getUser(),   // 200ms
    getPosts(),  // 300ms  } All run simultaneously
    getStats(),  // 150ms
  ])
  // Total: 300ms (longest)
}

// BETTER: Streaming with independent Suspense
export default function Page() {
  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
    </>
  )
}
```

## Request Deduplication

React automatically deduplicates identical fetch calls:

```typescript
// lib/queries.ts
import { cache } from "react"

// Memoized for single request
export const getUser = cache(async (userId: string) => {
  console.log("Fetching user...") // Only logs once per request!
  return db.users.findUnique({ where: { id: userId } })
})

// page.tsx
async function Page() {
  const user = await getUser("123") // First call
  return <Layout user={user} />
}

// Layout.tsx (same request)
async function Layout({ children }) {
  const user = await getUser("123") // Deduplicated - uses cached result
  return <nav>{user.name}</nav>
}
```

## Route Prefetching Strategy

```typescript
// Automatic prefetching on viewport (default)
<Link href="/dashboard">Dashboard</Link>

// Disable for rarely used links
<Link href="/privacy-policy" prefetch={false}>Privacy</Link>

// Manual prefetch on hover (critical paths)
"use client"
import { useRouter } from "next/navigation"

function CheckoutButton() {
  const router = useRouter()

  return (
    <button
      onMouseEnter={() => router.prefetch("/checkout")}
      onClick={() => router.push("/checkout")}
    >
      Checkout
    </button>
  )
}
```

## Memory Management

### Common Memory Leaks

```typescript
// LEAK: Global module cache grows unbounded
// lib/cache.ts
const cache = new Map() // Never cleared!

export function getCached(key: string) {
  if (!cache.has(key)) {
    cache.set(key, expensiveComputation())
  }
  return cache.get(key)
}

// FIX: Use LRU cache or React cache()
import { LRUCache } from "lru-cache"

const cache = new LRUCache({ max: 500 })

// Or use React's request-scoped cache
import { cache } from "react"
export const getCached = cache(async (key: string) => {
  return expensiveComputation()
})
```

### Event Listener Cleanup

```typescript
// LEAK: No cleanup
"use client"
function Component() {
  useEffect(() => {
    window.addEventListener("resize", handleResize)
    // Missing cleanup!
  }, [])
}

// FIX: Always cleanup
function Component() {
  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
}
```

### AbortController for Fetch

```typescript
"use client"
function SearchResults({ query }) {
  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults)
      .catch(e => {
        if (e.name !== "AbortError") throw e
      })

    return () => controller.abort()
  }, [query])
}
```

## Production Monitoring

### Web Vitals Reporting

```typescript
// app/providers.tsx
"use client"

import { useReportWebVitals } from "next/web-vitals"

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to analytics
    fetch("/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating, // "good" | "needs-improvement" | "poor"
        id: metric.id,
      }),
    })
  })

  return null
}
```

### Server Timing Headers

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const start = Date.now()

  const response = NextResponse.next()

  // Add timing header for debugging
  response.headers.set(
    "Server-Timing",
    `middleware;dur=${Date.now() - start}`
  )

  return response
}
```

### Error Monitoring

```typescript
// lib/monitoring.ts
export async function reportError(error: Error, context?: object) {
  // Sentry, Datadog, etc.
  await fetch("/api/error", {
    method: "POST",
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    }),
  })
}

// app/error.tsx
"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/monitoring"

export default function Error({ error, reset }) {
  useEffect(() => {
    reportError(error, { page: window.location.pathname })
  }, [error])

  return <ErrorUI onRetry={reset} />
}
```

## Image Optimization Advanced

### Responsive Images

```typescript
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 75vw,
         50vw"
  priority
/>
```

### Blur Placeholder Generation

```typescript
// For static images, use plaiceholder
import { getPlaiceholder } from "plaiceholder"

async function getBlurDataURL(src: string) {
  const { base64 } = await getPlaiceholder(src)
  return base64
}

// For dynamic images, generate at build/upload time
const blurDataURL = await getBlurDataURL("/hero.jpg")
```

### Image Loading Priority

| Location | Priority | Preload |
|----------|----------|---------|
| Above fold hero | `priority` | Yes |
| Above fold secondary | `loading="eager"` | No |
| Below fold | Default (lazy) | No |
| Carousel/hidden | `loading="lazy"` | No |

## Build Optimization

### Bundle Size Budgets

```json
// next.config.js
{
  experimental: {
    webpackBuildWorker: true
  },
  // Add bundle analysis
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
      config.plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: "static",
        reportFilename: "./analyze/client.html"
      }))
    }
    return config
  }
}
```

### Heavy Dependencies Strategy

| Library | Size | Strategy |
|---------|------|----------|
| moment.js | 300KB | Replace with date-fns or dayjs |
| lodash | 70KB | Import individual functions |
| recharts | 500KB | Dynamic import |
| monaco-editor | 2MB | Dynamic import, ssr: false |
| three.js | 600KB | Dynamic import, ssr: false |

```typescript
// Heavy libraries - always dynamic
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
})

const Chart = dynamic(() => import("recharts").then(mod => mod.LineChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})
```

## Anti-Patterns

| Don't | Impact | Do Instead |
|-------|--------|------------|
| No Image dimensions | CLS | Always set width/height |
| Google Fonts CDN | CLS, LCP | Use next/font |
| useEffect for data | INP | Server Component fetch |
| Large client components | INP | Server Components + islands |
| No Suspense boundaries | LCP | Streaming with Suspense |
| Barrel exports | Bundle size | Direct imports |
| Sequential fetches | TTFB | Promise.all() |
| No prefetching | Navigation speed | Link prefetch |
| Global caches | Memory leaks | LRU cache or React cache() |
| Missing cleanup | Memory leaks | useEffect cleanup |
| Large libraries sync | Bundle size | Dynamic imports |

## Performance Checklist

### Build Time
- [ ] Run bundle analyzer regularly
- [ ] Set size budgets for critical routes
- [ ] Audit dependencies for tree-shaking

### Runtime
- [ ] Profile with React DevTools
- [ ] Check for memory leaks
- [ ] Monitor Web Vitals in production

### Images
- [ ] All images use next/image
- [ ] Hero images have `priority`
- [ ] Sizes prop for responsive images
- [ ] Blur placeholders for LCP images

### Fonts
- [ ] Using next/font (self-hosted)
- [ ] display: swap for all fonts
- [ ] Subset fonts (latin only if applicable)

### Data
- [ ] No useEffect for initial data
- [ ] Parallel fetching where possible
- [ ] Suspense boundaries for streaming
- [ ] Request deduplication with cache()
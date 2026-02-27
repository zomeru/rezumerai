# Debugging & Profiling

## React DevTools

### Installation

```bash
# Browser extension
# Chrome: React Developer Tools
# Firefox: React Developer Tools

# Standalone for debugging React Native / Electron
npm install -g react-devtools
```

### Using Components Tab

**Finding Components:**
- Use search to find components by name
- Click to select and inspect props/state
- Use the eye icon to highlight in browser

**Debugging Tips:**
- Look for yellow/orange warnings on components
- Check "rendered by" to trace component tree
- Use "owners" to see what triggered render

### Using Profiler

```typescript
// Enable profiling in development
// React DevTools > Profiler tab > Record

// Steps:
// 1. Click record
// 2. Interact with app
// 3. Stop recording
// 4. Analyze flame graph

// Look for:
// - Long bars (slow renders)
// - Gray bars (didn't render - good!)
// - Components rendering when they shouldn't
```

### Why Did You Render

```bash
npm install @welldone-software/why-did-you-render
```

```typescript
// lib/wdyr.ts (development only)
import React from "react"

if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render")
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOnDifferentValues: true,
  })
}

// Import at top of app
// app/layout.tsx
import "@/lib/wdyr"

// Mark specific components
MyComponent.whyDidYouRender = true
```

## Next.js Debugging

### VS Code Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### Debug Server Components

```typescript
// Add debugger statement
export default async function Page() {
  const data = await getData()
  debugger // Pauses in VS Code
  return <div>{data}</div>
}

// Or use console with more context
console.log("[Page] Rendering with data:", JSON.stringify(data, null, 2))
```

### Debug Server Actions

```typescript
"use server"

export async function createPost(formData: FormData) {
  // Log input
  console.log("[createPost] Input:", Object.fromEntries(formData))

  try {
    const result = await db.post.create({ ... })
    console.log("[createPost] Success:", result.id)
    return { success: true, data: result }
  } catch (error) {
    console.error("[createPost] Error:", error)
    return { success: false, error: "Failed" }
  }
}
```

### Debug Middleware

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  console.log("[Middleware]", {
    pathname: request.nextUrl.pathname,
    method: request.method,
    headers: Object.fromEntries(request.headers),
  })

  // ...
}
```

## Network Debugging

### Inspect Server Component Fetches

```typescript
// Wrap fetch to log all requests
const originalFetch = global.fetch

global.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.url
  const start = Date.now()

  console.log(`[Fetch] Starting: ${url}`)

  try {
    const response = await originalFetch(input, init)
    console.log(`[Fetch] Completed: ${url} (${Date.now() - start}ms) - ${response.status}`)
    return response
  } catch (error) {
    console.error(`[Fetch] Failed: ${url} (${Date.now() - start}ms)`, error)
    throw error
  }
}
```

### Debug Cache Behavior

```typescript
// Force no cache to debug fresh data
fetch(url, {
  cache: "no-store",
  next: { tags: ["debug"] },
})

// Check if data is cached
export default async function Page() {
  const start = Date.now()
  const data = await getData()
  const duration = Date.now() - start

  console.log(`[Page] Data fetched in ${duration}ms (cached if <10ms)`)

  return <div>{JSON.stringify(data)}</div>
}
```

## Performance Profiling

### Bundle Analysis

```bash
# Install analyzer
npm install @next/bundle-analyzer

# next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer({})

# Run analysis
ANALYZE=true npm run build
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse

on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: npm run build

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: ./lighthouserc.json
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run start",
      "url": ["http://localhost:3000", "http://localhost:3000/products"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }]
      }
    }
  }
}
```

### Web Vitals Monitoring

```typescript
// app/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}

// Custom reporting
// components/WebVitals.tsx
"use client"

import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric)

    // Send to analytics
    if (metric.name === "LCP" && metric.value > 2500) {
      console.warn("LCP is too slow:", metric.value)
    }
  })

  return null
}
```

## Error Tracking

### Sentry Setup

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: process.env.NODE_ENV === "development",
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

### Custom Error Boundary

```typescript
// components/ErrorBoundary.tsx
"use client"

import { Component, ReactNode } from "react"
import * as Sentry from "@sentry/nextjs"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }

    return this.props.children
  }
}
```

## Logging Best Practices

### Structured Logging

```typescript
// lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  userId?: string
  requestId?: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  if (process.env.NODE_ENV === "development") {
    console[level](JSON.stringify(entry, null, 2))
  } else {
    // Production: structured JSON for log aggregation
    console[level](JSON.stringify(entry))
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => log("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => log("error", msg, ctx),
}

// Usage
logger.info("User signed in", { userId: "123", method: "oauth" })
logger.error("Payment failed", { orderId: "456", error: error.message })
```

### Request Tracing

```typescript
// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID()

  // Add to headers for downstream use
  const response = NextResponse.next()
  response.headers.set("x-request-id", requestId)

  // Log request
  console.log(
    JSON.stringify({
      type: "request",
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })
  )

  return response
}
```

## Memory Leak Detection

### Common Leak Patterns

```typescript
// LEAK: Uncleared interval
"use client"
function Component() {
  useEffect(() => {
    const id = setInterval(() => {}, 1000)
    // Missing cleanup!
  }, [])
}

// FIX: Clear interval
function Component() {
  useEffect(() => {
    const id = setInterval(() => {}, 1000)
    return () => clearInterval(id)
  }, [])
}

// LEAK: Event listener not removed
function Component() {
  useEffect(() => {
    window.addEventListener("resize", handleResize)
    // Missing cleanup!
  }, [])
}

// FIX: Remove listener
function Component() {
  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
}

// LEAK: Subscription not cancelled
function Component() {
  useEffect(() => {
    const subscription = api.subscribe()
    // Missing cleanup!
  }, [])
}

// FIX: Cancel subscription
function Component() {
  useEffect(() => {
    const subscription = api.subscribe()
    return () => subscription.unsubscribe()
  }, [])
}
```

### Memory Profiling

```bash
# Run with memory inspection
NODE_OPTIONS='--inspect' npm run dev

# Open chrome://inspect in Chrome
# Click "inspect" on the Node target
# Go to Memory tab
# Take heap snapshots before/after actions
# Compare to find leaks
```

## Database Query Debugging

### Prisma Query Logging

```typescript
// lib/db/client.ts
const db = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "warn" },
  ],
})

db.$on("query", (e) => {
  console.log("Query:", e.query)
  console.log("Params:", e.params)
  console.log("Duration:", e.duration, "ms")
})
```

### Slow Query Detection

```typescript
// lib/db/client.ts
const SLOW_QUERY_THRESHOLD = 100 // ms

db.$on("query", (e) => {
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    console.warn(`Slow query (${e.duration}ms):`, e.query)
  }
})
```

## Debugging Checklist

### General

- [ ] Check browser console for errors
- [ ] Check terminal/server logs
- [ ] Verify environment variables
- [ ] Check network tab for failed requests
- [ ] Confirm correct file is being edited

### React Issues

- [ ] Check React DevTools for component tree
- [ ] Verify props are passed correctly
- [ ] Check for hydration mismatches
- [ ] Use Profiler to find slow renders

### Data Fetching

- [ ] Log fetch URLs and responses
- [ ] Check cache behavior
- [ ] Verify API returns expected data
- [ ] Check for N+1 queries

### Performance

- [ ] Run Lighthouse audit
- [ ] Check bundle size
- [ ] Profile with React DevTools
- [ ] Monitor Web Vitals

### Production Issues

- [ ] Check error tracking (Sentry)
- [ ] Review server logs
- [ ] Check deployment status
- [ ] Verify environment configuration
/**
 * Next.js 16+ Proxy (formerly middleware.ts)
 *
 * IMPORTANT: In Next.js 16, middleware.ts is renamed to proxy.ts
 * - Function name: middleware() → proxy()
 * - Runtime: Node.js only (Edge runtime NOT supported)
 *
 * Migration: npx @next/codemod middleware-to-proxy
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// DENY BY DEFAULT: Only these routes are public
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/health",
]

// Routes that require specific roles
const adminRoutes = ["/admin"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check authentication
  const session = await auth()

  if (!session) {
    // For API routes, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For pages, redirect to login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isAdminRoute && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next()
  response.headers.set("x-user-id", session.user.id)
  response.headers.set("x-request-id", crypto.randomUUID())

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
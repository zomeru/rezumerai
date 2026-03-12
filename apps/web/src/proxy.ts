import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROUTES } from "@/constants/routing";
import { canAccessAuthPage, canAccessSessionRoute } from "@/lib/auth-route-access";
import { resolveRequestSessionIdentity } from "@/lib/request-auth";

/**
 * Routes that require a session identity.
 * Anonymous and registered sessions are both allowed here.
 */
const PROTECTED_ROUTES: string[] = [
  ROUTES.WORKSPACE,
  ROUTES.BUILDER,
  ROUTES.PREVIEW,
  ROUTES.SETTINGS,
  ROUTES.TEXT_OPTIMIZER,
];

function rewriteToNotFound(request: NextRequest): NextResponse {
  const notFoundUrl = new URL("/_not-found", request.url);
  return NextResponse.rewrite(notFoundUrl, { status: 404 });
}

/**
 * Helper to set security headers
 */
function setSecurityHeaders(res: NextResponse, isDev: boolean) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-XSS-Protection", "1; mode=block");

  if (!isDev) {
    // HSTS only in production
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

/**
 * Build dynamic Content Security Policy
 */
function buildCSP(isDev: boolean) {
  const scriptSrc = ["'self'", "blob:"];
  const connectSrc = ["'self'", "blob:"];

  if (isDev) {
    scriptSrc.push("'unsafe-eval'", "'unsafe-inline'", "https://vercel.live");
  } else {
    // Production: Tailwind inline styles only
    scriptSrc.push("'unsafe-inline'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectSrc.join(" ")}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Proxy for route protection and security headers.
 * Runs on every request matching the config.matcher patterns.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV !== "production";

  // Skip API routes entirely for CSP/auth headers
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Auth session
  const authContext = await resolveRequestSessionIdentity(request.headers);
  const { role, session, userId } = authContext;
  const isAdminRoute = pathname.startsWith(ROUTES.ADMIN);

  if (isAdminRoute) {
    if (!userId || role !== "ADMIN") {
      return rewriteToNotFound(request);
    }
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect users without any session identity from session-gated routes.
  if (isProtectedRoute && !canAccessSessionRoute(session)) {
    const signInUrl = new URL(ROUTES.SIGNIN, request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Only redirect registered users away from auth pages.
  if (!canAccessAuthPage(session) && (pathname === ROUTES.SIGNIN || pathname === ROUTES.SIGNUP)) {
    return NextResponse.redirect(new URL(ROUTES.WORKSPACE, request.url));
  }

  // Response with security headers
  const response = NextResponse.next();
  setSecurityHeaders(response, isDev);
  response.headers.set("Content-Security-Policy", buildCSP(isDev));

  return response;
}

/**
 * Proxy runs on all routes except static files and API routes
 */
export const config: {
  matcher: string[];
} = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

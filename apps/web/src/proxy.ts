import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Proxy for route protection and security headers.
 * Runs on every request matching the config.matcher patterns.
 */
export function proxy(_request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Build connect-src dynamically based on environment
  const connectSources = ["'self'", "https://api.rezumer.ai", "blob:"];

  // Allow localhost in development for API and Vercel live reload
  const scriptSources = ["'self'", "'unsafe-eval'", "'unsafe-inline'", "blob:"];

  if (process.env.NODE_ENV !== "production") {
    connectSources.push("http://localhost:8080");
    scriptSources.push("https://vercel.live", "http://localhost:8080");
  }

  // Apply strict Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "worker-src 'self' blob:", // Allow web workers from same origin and blob URLs
    "child-src 'self' blob:", // Allow child contexts (workers, frames) from blob URLs
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  // Additional security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Strict-Transport-Security (HSTS) - only enable in production with HTTPS
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

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

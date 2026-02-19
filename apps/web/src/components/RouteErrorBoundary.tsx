"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { type ErrorSeverity, logError } from "@/lib/errors";
import type { ErrorWithDigest } from "./ErrorBoundary";

export interface RouteErrorBoundaryProps {
  error: ErrorWithDigest;
  reset: () => void;
  icon?: string;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  homeRoute?: string;
  extraContent?: ReactNode;
  logContext?: Record<string, unknown>;
  severity?: ErrorSeverity;
}

/**
 * Reusable error boundary component for route-level error handling.
 * Provides consistent error UI with customizable content and actions.
 */
export function RouteErrorBoundary({
  error,
  reset,
  icon = "⚠️",
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
  showHomeButton = false,
  homeRoute = "/",
  extraContent,
  logContext = {},
  severity = "error",
}: RouteErrorBoundaryProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    logError(error, severity, {
      route: pathname,
      ...logContext,
    });
  }, [error, pathname, logContext, severity]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        {/* Error icon */}
        <div className="mb-4 text-6xl" role="img" aria-label="Error icon">
          {icon}
        </div>

        {/* Error title */}
        <h1 className="mb-2 font-bold text-2xl text-slate-900">{title}</h1>

        {/* User-friendly message */}
        <p className="mb-6 text-slate-600">{description}</p>

        {/* Extra content (tips, warnings, etc.) */}
        {extraContent && <div className="mb-6">{extraContent}</div>}

        {/* Development mode error details */}
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 rounded-lg bg-slate-100 p-4 text-left">
            <summary className="cursor-pointer font-medium text-slate-900 text-sm">Developer Details</summary>
            <div className="mt-2 space-y-2">
              <p className="font-mono text-slate-800 text-xs">
                <strong>Error:</strong> {error.message}
              </p>
              {error.digest && (
                <p className="font-mono text-slate-800 text-xs">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-200 p-2 font-mono text-slate-900 text-xs">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className={showHomeButton ? "flex gap-3" : "space-y-3"}>
          <button
            type="button"
            onClick={reset}
            className={`rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              showHomeButton ? "flex-1" : "w-full"
            }`}
          >
            Try again
          </button>
          {showHomeButton && (
            <button
              type="button"
              onClick={() => router.push(homeRoute)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

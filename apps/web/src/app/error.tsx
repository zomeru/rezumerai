"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errors";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root-level error boundary.
 * Catches errors in app routes (below global-error.tsx in hierarchy).
 * Provides user-friendly interface with retry and navigation actions.
 */
export default function RootError({ error, reset }: ErrorProps): React.JSX.Element {
  useEffect(() => {
    // Log error with context for monitoring
    logError(error, "error", {
      route: window.location.pathname,
      component: "RootErrorBoundary",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        {/* Error icon */}
        <div className="mb-4 text-6xl" role="img" aria-label="Error icon">
          ⚠️
        </div>

        {/* Error title */}
        <h1 className="mb-2 font-bold text-2xl text-slate-900">Something went wrong</h1>

        {/* User-friendly message */}
        <p className="mb-6 text-slate-600">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

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
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-slate-700 text-xs">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={(): void => {
              window.location.href = "/";
            }}
            className="w-full rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            Go to homepage
          </button>
        </div>
      </div>
    </div>
  );
}

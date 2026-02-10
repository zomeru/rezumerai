"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errors";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for workspace routes.
 * Catches errors and provides a user-friendly interface to recover.
 */
export default function WorkspaceError({ error, reset }: ErrorProps): React.JSX.Element {
  useEffect(() => {
    // Log error with context for monitoring
    logError(error, "error", {
      route: "/workspace",
      component: "WorkspaceError",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-2 font-bold text-2xl text-slate-900">Something went wrong</h1>
        <p className="mb-6 text-slate-600">We encountered an error loading this page. Please try again.</p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 rounded-lg bg-slate-100 p-4 text-left">
            <p className="font-mono text-slate-700 text-sm">{error.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={(): void => window.location.reload()}
            className="flex-1 rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

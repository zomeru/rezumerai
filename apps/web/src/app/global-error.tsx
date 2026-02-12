"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errors";

/**
 * Global error boundary that catches errors in the root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    // Log critical error with maximum severity
    logError(error, "fatal", {
      component: "GlobalErrorBoundary",
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
    });
  }, [error]);
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-6xl">⚠️</div>
            <h1 className="mb-2 font-bold text-2xl text-slate-900">Critical Error</h1>
            <p className="mb-6 text-slate-600">Something went wrong. Please refresh the page.</p>

            <button
              type="button"
              onClick={reset}
              className="w-full rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

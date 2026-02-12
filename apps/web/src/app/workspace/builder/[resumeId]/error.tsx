"use client";

import { useEffect } from "react";
import { ROUTES } from "@/constants/routing";
import { logError } from "@/lib/errors";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Resume builder error boundary.
 * Handles errors in the resume builder interface (form validation, autosave, etc.).
 * Provides data recovery guidance and navigation options.
 */
export default function BuilderError({ error, reset }: ErrorProps): React.JSX.Element {
  useEffect(() => {
    logError(error, "error", {
      route: window.location.pathname,
      component: "BuilderError",
      action: "resume_editing",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">✏️</div>
        <h1 className="mb-2 font-bold text-2xl text-slate-900">Builder Error</h1>
        <p className="mb-6 text-slate-600">
          We encountered an error while editing your resume. Your changes may not have been saved. Please try again.
        </p>

        {/* Data recovery tip */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
          <p className="font-medium text-blue-900 text-sm">💡 Tip</p>
          <p className="mt-1 text-blue-800 text-xs">
            If the error persists, try refreshing the page. Your auto-saved changes should be restored.
          </p>
        </div>

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
            </div>
          </details>
        )}

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
            onClick={(): void => window.location.reload()}
            className="w-full rounded-lg border border-primary-300 px-6 py-3 font-semibold text-primary-700 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
          >
            Refresh page
          </button>
          <button
            type="button"
            onClick={(): void => {
              window.location.href = ROUTES.WORKSPACE;
            }}
            className="w-full rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            Back to workspace
          </button>
        </div>
      </div>
    </div>
  );
}

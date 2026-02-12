"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errors";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Sign up page error boundary.
 * Handles registration errors with helpful messaging and recovery options.
 */
export default function SignUpError({ error, reset }: ErrorProps): React.JSX.Element {
  useEffect(() => {
    logError(error, "warning", {
      route: "/signup",
      component: "SignUpError",
      action: "registration",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">📝</div>
        <h1 className="mb-2 font-bold text-2xl text-slate-900">Sign Up Error</h1>
        <p className="mb-6 text-slate-600">
          We couldn't complete your registration. Please try again or sign in if you already have an account.
        </p>

        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 rounded-lg bg-slate-100 p-4 text-left">
            <summary className="cursor-pointer font-medium text-slate-900 text-sm">Developer Details</summary>
            <p className="mt-2 font-mono text-slate-800 text-xs">{error.message}</p>
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
            onClick={(): void => {
              window.location.href = "/signin";
            }}
            className="w-full rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            Sign in instead
          </button>
        </div>
      </div>
    </div>
  );
}

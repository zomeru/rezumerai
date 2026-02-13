"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { ROUTES } from "@/constants/routing";

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
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      icon="✏️"
      title="Builder Error"
      description="We encountered an error while editing your resume. Your changes may not have been saved. Please try again."
      showHomeButton
      homeRoute={ROUTES.WORKSPACE}
      extraContent={
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
          <p className="font-medium text-blue-900 text-sm">💡 Tip</p>
          <p className="mt-1 text-blue-800 text-xs">
            If the error persists, try refreshing the page. Your auto-saved changes should be restored.
          </p>
        </div>
      }
      logContext={{ component: "BuilderError", action: "resume_editing" }}
      severity="error"
    />
  );
}

"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for workspace routes.
 * Catches errors and provides a user-friendly interface to recover.
 */
export default function WorkspaceError({ error, reset }: ErrorProps): React.JSX.Element {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      icon="⚠️"
      title="Something went wrong"
      description="We encountered an error loading this page. Please try again."
      logContext={{ component: "WorkspaceError" }}
      severity="error"
    />
  );
}

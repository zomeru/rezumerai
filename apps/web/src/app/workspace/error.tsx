"use client";

import { RouteErrorBoundary, type RouteErrorBoundaryProps } from "@/components/RouteErrorBoundary";

/**
 * Error boundary for workspace routes.
 * Catches errors and provides a user-friendly interface to recover.
 */
export default function WorkspaceError({ error, reset }: RouteErrorBoundaryProps) {
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

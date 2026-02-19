"use client";

import { RouteErrorBoundary, type RouteErrorBoundaryProps } from "@/components/RouteErrorBoundary";

/**
 * Root-level error boundary with retry and navigation actions.
 */
export default function RootError({ error, reset }: RouteErrorBoundaryProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      icon="⚠️"
      title="Something went wrong"
      description="We encountered an unexpected error. Please try again or return to the homepage."
      showHomeButton
      logContext={{ component: "RootErrorBoundary" }}
      severity="error"
    />
  );
}

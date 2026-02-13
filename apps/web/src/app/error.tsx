"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root-level error boundary with retry and navigation actions.
 */
export default function RootError({ error, reset }: ErrorProps): React.JSX.Element {
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

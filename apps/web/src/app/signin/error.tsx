"use client";

import { RouteErrorBoundary, type RouteErrorBoundaryProps } from "@/components/RouteErrorBoundary";

/**
 * Sign in page error boundary.
 * Handles authentication-related errors with appropriate messaging.
 */
export default function SignInError({ error, reset }: RouteErrorBoundaryProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      icon="🔐"
      title="Sign In Error"
      description="We couldn't complete the sign in process. This might be due to a temporary issue with the authentication service."
      showHomeButton
      logContext={{ component: "SignInError", action: "authentication" }}
      severity="warning"
    />
  );
}

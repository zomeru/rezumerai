"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { ROUTES } from "@/constants/routing";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Sign up page error boundary.
 * Handles registration errors with helpful messaging and recovery options.
 */
export default function SignUpError({ error, reset }: ErrorProps): React.JSX.Element {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      icon="📝"
      title="Sign Up Error"
      description="We couldn't complete your registration. Please try again or sign in if you already have an account."
      showHomeButton
      homeRoute={ROUTES.SIGNIN}
      logContext={{ component: "SignUpError", action: "registration" }}
      severity="warning"
    />
  );
}

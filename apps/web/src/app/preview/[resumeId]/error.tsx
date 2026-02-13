"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { ROUTES } from "@/constants/routing";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Resume preview error boundary.
 * Handles errors during resume preview rendering (PDF generation, template rendering, etc.).
 */
export default function PreviewError({ error, reset }: ErrorProps): React.JSX.Element {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      icon="📄"
      title="Preview Error"
      description="We couldn't generate the preview for this resume. This might be due to missing data or a temporary issue."
      showHomeButton
      homeRoute={ROUTES.WORKSPACE}
      logContext={{ component: "PreviewError", action: "resume_preview" }}
      severity="error"
    />
  );
}

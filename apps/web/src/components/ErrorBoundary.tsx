"use client";

/**
 * Enterprise-level Error Boundary component.
 * Catches React rendering errors and provides graceful fallback UI.
 *
 * Features:
 * - Automatic error logging with context
 * - User-friendly error messages
 * - Retry mechanism with exponential backoff
 * - Custom fallback components
 * - Focus management for accessibility
 * - Development mode debugging
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomFallback />}>
 *   <RiskyComponent />
 * </ErrorBoundary>
 * ```
 */

import { useRouter } from "next/navigation";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { type ErrorContext, type ErrorSeverity, getUserFriendlyMessage, logError } from "@/lib/errors";

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback UI (optional) */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Error severity level for logging */
  severity?: ErrorSeverity;
  /** Additional context for error logging */
  context?: ErrorContext;
  /** Callback invoked when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback invoked when user attempts to reset */
  onReset?: () => void;
  /** Whether to show retry button (default: true) */
  showRetry?: boolean;
  /** Whether to show error details in development (default: true) */
  showDevDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Default fallback UI component.
 * Provides user-friendly error message with retry action.
 */
function DefaultFallback({
  error,
  reset,
  showRetry = true,
  showDevDetails = true,
  retryCount,
}: {
  error: Error;
  reset: () => void;
  showRetry?: boolean;
  showDevDetails?: boolean;
  retryCount: number;
}): React.JSX.Element {
  const router = useRouter();
  const userMessage = getUserFriendlyMessage(error);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-100 items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8"
    >
      <div className="w-full max-w-md text-center">
        {/* Error icon */}
        <div className="mb-4 text-6xl" role="img" aria-label="Error icon">
          ⚠️
        </div>

        {/* Error title */}
        <h2 className="mb-2 font-semibold text-lg text-red-900">Something went wrong</h2>

        {/* User-friendly message */}
        <p className="mb-6 text-red-700 text-sm">{userMessage}</p>

        {/* Development mode details */}
        {showDevDetails && process.env.NODE_ENV === "development" && (
          <details className="mb-6 rounded-lg bg-red-100 p-4 text-left">
            <summary className="cursor-pointer font-medium text-red-900 text-sm">Developer Details</summary>
            <div className="mt-2 space-y-2">
              <p className="font-mono text-red-800 text-xs">
                <strong>Error:</strong> {error.message}
              </p>
              {"digest" in error && (
                <p className="font-mono text-red-800 text-xs">
                  <strong>Digest:</strong> {(error as Error & { digest?: string }).digest}
                </p>
              )}
              {error.stack && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-red-800 text-xs">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {showRetry && (
            <button
              type="button"
              onClick={reset}
              disabled={retryCount >= 3}
              className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-sm text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={retryCount >= 3 ? "Maximum retries reached" : "Try again"}
            >
              {retryCount >= 3 ? "Max retries reached" : "Try again"}
            </button>
          )}
          <button
            type="button"
            onClick={(): void => router.refresh()}
            className="flex-1 rounded-lg border border-red-300 bg-white px-6 py-3 font-semibold text-red-900 text-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
          >
            Reload page
          </button>
        </div>

        {/* Retry count indicator */}
        {retryCount > 0 && retryCount < 3 && (
          <output className="mt-4 block text-red-600 text-xs">Retry attempt {retryCount} of 3</output>
        )}
      </div>
    </div>
  );
}

/**
 * Error Boundary class component.
 * Catches errors in child component tree and displays fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to trigger fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { severity = "error", context = {}, onError } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Log error with context
    logError(error, severity, {
      ...context,
      component: errorInfo.componentStack?.split("\n")[1]?.trim(),
      metadata: {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    });

    // Invoke custom error handler
    onError?.(error, errorInfo);
  }

  /**
   * Resets error boundary state and attempts to re-render children.
   * Implements exponential backoff for retry attempts.
   */
  private handleReset = (): void => {
    const { onReset } = this.props;
    const { retryCount } = this.state;

    // Don't allow more than 3 retries
    if (retryCount >= 3) {
      return;
    }

    // Calculate exponential backoff delay
    const delay = Math.min(1000 * 2 ** retryCount, 10000);

    // Increment retry count
    this.setState({ retryCount: retryCount + 1 });

    // Reset after delay (exponential backoff)
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
      onReset?.();
    }, delay);
  };

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, showRetry = true, showDevDetails = true } = this.props;

    if (hasError && error) {
      // Render custom fallback if provided
      if (fallback) {
        return typeof fallback === "function" ? fallback(error, this.handleReset) : fallback;
      }

      // Render default fallback
      return (
        <DefaultFallback
          error={error}
          reset={this.handleReset}
          showRetry={showRetry}
          showDevDetails={showDevDetails}
          retryCount={retryCount}
        />
      );
    }

    // Render children normally
    return children;
  }
}

/**
 * Higher-order component that wraps a component with an error boundary.
 *
 * @param Component - Component to wrap
 * @param errorBoundaryProps - Error boundary configuration
 * @returns Wrapped component with error boundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(RiskyComponent, {
 *   context: { component: 'RiskyComponent' },
 *   severity: 'warning',
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, "children"> = {},
): React.ComponentType<P> {
  const WrappedComponent = (props: P): React.JSX.Element => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Preserve component name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}

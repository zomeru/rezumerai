/**
 * Enterprise-level error logging and handling utilities.
 * Provides structured error logging with monitoring integration support (Sentry, Datadog, etc.).
 *
 * Features:
 * - Type-safe error context
 * - Development vs production mode handling
 * - Error severity levels
 * - Structured logging for monitoring tools
 * - User-friendly error message generation
 */

export type ErrorSeverity = "debug" | "info" | "warning" | "error" | "fatal";

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** User action that triggered the error */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** User ID if authenticated */
  userId?: string;
  /** Request ID for correlation */
  requestId?: string;
  /** Route or path where error occurred */
  route?: string;
}

export interface LoggedError {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context: ErrorContext;
  digest?: string;
}

/**
 * Logs an error with structured context.
 * In production, this should integrate with monitoring services (Sentry, Datadog, etc.).
 *
 * @param error - Error object or string message
 * @param severity - Error severity level
 * @param context - Additional context for debugging
 * @returns Logged error object
 */
export function logError(
  error: Error | string,
  severity: ErrorSeverity = "error",
  context: ErrorContext = {},
): LoggedError {
  const errorObj = typeof error === "string" ? new Error(error) : error;
  const loggedError: LoggedError = {
    message: errorObj.message,
    stack: errorObj.stack,
    severity,
    timestamp: new Date(),
    context,
    digest: "digest" in errorObj ? (errorObj as Error & { digest?: string }).digest : undefined,
  };

  // Development: Log to console with full details
  if (process.env.NODE_ENV === "development") {
    const style = "font-weight: bold; padding: 2px 4px; border-radius: 2px;";
    const severityColors: Record<ErrorSeverity, string> = {
      debug: "background: #6b7280; color: white;",
      info: "background: #3b82f6; color: white;",
      warning: "background: #f59e0b; color: white;",
      error: "background: #ef4444; color: white;",
      fatal: "background: #991b1b; color: white;",
    };

    console.group(`%c${severity.toUpperCase()}`, `${style} ${severityColors[severity]}`);
    console.error(errorObj);
    console.table(context);
    console.groupEnd();
  }

  // Production: Send to monitoring service
  // TODO: Replace with actual monitoring integration (Sentry, Datadog, etc.)
  if (process.env.NODE_ENV === "production") {
    try {
      // Example Sentry integration (commented out - requires setup):
      // if (typeof window !== "undefined" && window.Sentry) {
      //   window.Sentry.captureException(errorObj, {
      //     level: severity as Sentry.SeverityLevel,
      //     contexts: { custom: context },
      //   });
      // }

      // Fallback: Log to console in production (should be replaced with actual service)
      console.error("[Error Logger]", {
        message: loggedError.message,
        severity,
        context,
        timestamp: loggedError.timestamp.toISOString(),
      });
    } catch (loggingError) {
      // Fail silently to avoid breaking app due to logging failures
      console.error("Failed to log error:", loggingError);
    }
  }

  return loggedError;
}

/**
 * Generates user-friendly error messages based on error type.
 * Maps technical errors to human-readable messages.
 *
 * @param error - Error object
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message.toLowerCase();

  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return "We're having trouble connecting. Please check your internet connection and try again.";
  }

  // Timeout errors
  if (message.includes("timeout")) {
    return "The request took too long to complete. Please try again.";
  }

  // Authentication errors
  if (message.includes("unauthorized") || message.includes("401")) {
    return "Your session has expired. Please sign in again.";
  }

  // Permission errors
  if (message.includes("forbidden") || message.includes("403")) {
    return "You don't have permission to access this resource.";
  }

  // Not found errors
  if (message.includes("not found") || message.includes("404")) {
    return "We couldn't find what you're looking for. It may have been moved or deleted.";
  }

  // Server errors
  if (message.includes("500") || message.includes("server")) {
    return "Something went wrong on our end. Our team has been notified. Please try again later.";
  }

  // Validation errors
  if (message.includes("validation") || message.includes("invalid")) {
    return "The information provided is invalid. Please check your input and try again.";
  }

  // Generic fallback
  return "Something went wrong. Please try again or contact support if the problem persists.";
}

/**
 * Extracts error message from various error types.
 *
 * @param error - Error object or unknown value
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}

/**
 * Type guard to check if an error is a React Error with digest.
 *
 * @param error - Error to check
 * @returns True if error has digest property
 */
export function isReactError(error: unknown): error is Error & { digest: string } {
  return error instanceof Error && "digest" in error;
}

/**
 * Determines if an error should be retried.
 * Network errors and server errors (5xx) are typically retryable.
 *
 * @param error - Error to check
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  // Network errors are retryable
  if (message.includes("network") || message.includes("fetch failed")) {
    return true;
  }

  // Timeout errors are retryable
  if (message.includes("timeout")) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (message.match(/5\d{2}/)) {
    return true;
  }

  // Rate limiting might be retryable with backoff
  if (message.includes("429") || message.includes("rate limit")) {
    return true;
  }

  // Client errors (4xx) are typically not retryable
  if (message.match(/4\d{2}/)) {
    return false;
  }

  return false;
}

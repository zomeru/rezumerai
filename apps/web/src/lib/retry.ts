/**
 * Enterprise-level retry logic with exponential backoff.
 * Implements FAANG-standard retry strategies for resilient API calls.
 *
 * Features:
 * - Exponential backoff with jitter
 * - Configurable max attempts
 * - Retryable error detection
 * - Abort signal support
 * - TypeScript strict typing
 */

import { getErrorMessage, isRetryableError } from "./errors";

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Add random jitter to prevent thundering herd (default: true) */
  useJitter?: boolean;
  /** Custom retry condition (default: isRetryableError) */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback invoked before each retry */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  /** AbortSignal to cancel retry attempts */
  signal?: AbortSignal;
}

/**
 * Calculates exponential backoff delay with optional jitter.
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry configuration options
 * @returns Delay in milliseconds
 */
function calculateDelay(
  attempt: number,
  options: Pick<Required<RetryOptions>, "initialDelay" | "maxDelay" | "backoffMultiplier" | "useJitter">,
): number {
  const { initialDelay, maxDelay, backoffMultiplier, useJitter } = options;

  // Exponential backoff: initialDelay * (backoffMultiplier ^ attempt)
  const exponentialDelay = initialDelay * backoffMultiplier ** attempt;

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: random value between 0 and calculated delay
  // This prevents thundering herd problem where many clients retry simultaneously
  if (useJitter) {
    return Math.random() * cappedDelay;
  }

  return cappedDelay;
}

/**
 * Delays execution for specified milliseconds with abort signal support.
 *
 * @param ms - Milliseconds to delay
 * @param signal - Optional abort signal
 * @returns Promise that resolves after delay
 * @throws Error if aborted
 */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const timeout = setTimeout(resolve, ms);

    // Clean up timeout if aborted
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("Aborted"));
    });
  });
}

/**
 * Executes a function with automatic retry logic and exponential backoff.
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Result of successful function execution
 * @throws Error if all retry attempts fail
 *
 * @example
 * ```ts
 * const data = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Request failed');
 *     return response.json();
 *   },
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    useJitter = true,
    shouldRetry = isRetryableError,
    onRetry,
    signal,
  } = options;

  let lastError: unknown;

  // Attempt execution up to maxAttempts times
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check if aborted before attempt
      if (signal?.aborted) {
        throw new Error("Aborted");
      }

      // Execute function
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if aborted
      if (getErrorMessage(error).includes("Aborted")) {
        throw error;
      }

      // Check if we should retry this error
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(attempt, {
        initialDelay,
        maxDelay,
        backoffMultiplier,
        useJitter,
      });

      // Invoke retry callback if provided
      onRetry?.(error, attempt + 1, delayMs);

      // Wait before next attempt
      await delay(delayMs, signal);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Creates a retry wrapper around a function.
 * Useful for creating reusable functions with built-in retry logic.
 *
 * @param fn - Function to wrap
 * @param options - Retry configuration options
 * @returns Wrapped function with retry logic
 *
 * @example
 * ```ts
 * const fetchWithRetry = withRetry(
 *   async (url: string) => {
 *     const response = await fetch(url);
 *     if (!response.ok) throw new Error('Request failed');
 *     return response.json();
 *   },
 *   { maxAttempts: 3 }
 * );
 *
 * const data = await fetchWithRetry('/api/data');
 * ```
 */
export function withRetry<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {},
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

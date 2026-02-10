/**
 * Enterprise API client with retry logic and error handling.
 * Wraps Eden treaty client with automatic retries for network failures.
 *
 * Features:
 * - Exponential backoff retry logic
 * - Request timeout handling
 * - Error logging and monitoring
 * - Type-safe API responses
 * - AbortController support for request cancellation
 *
 * Usage:
 * ```ts
 * import { apiWithRetry } from '@/lib/api-client';
 *
 * const result = await apiWithRetry(
 *   () => api.api.users.get(),
 *   { maxAttempts: 3 }
 * );
 * ```
 */

import { getErrorMessage, logError } from "./errors";
import { type RetryOptions, retryWithBackoff } from "./retry";

/**
 * API response wrapper for type-safe error handling.
 */
export interface ApiResult<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Wraps an API call with retry logic and error handling.
 *
 * @param apiCall - Async function that makes the API call
 * @param retryOptions - Retry configuration options
 * @returns API result with data or error
 *
 * @example
 * ```ts
 * const result = await apiWithRetry(
 *   () => api.api.users({ id: '1' }).get(),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 *
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function apiWithRetry<T>(
  apiCall: () => Promise<{ data?: T; error?: unknown }>,
  retryOptions: RetryOptions = {},
): Promise<ApiResult<T>> {
  try {
    // Execute API call with retry logic
    const response = await retryWithBackoff(apiCall, {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      ...retryOptions,
      onRetry: (error: unknown, attempt: number, delay: number): void => {
        // Log retry attempts for monitoring
        logError(error instanceof Error ? error : new Error(String(error)), "warning", {
          component: "ApiClient",
          action: "retry_attempt",
          metadata: {
            attempt,
            delay,
          },
        });

        // Invoke custom retry callback if provided
        retryOptions.onRetry?.(error, attempt, delay);
      },
    });

    // Handle Eden treaty response format
    if (response.error) {
      const errorMessage = getErrorMessage(response.error);

      // Log API error
      logError(new Error(errorMessage), "error", {
        component: "ApiClient",
        action: "api_error",
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    // Log failed API call
    logError(error instanceof Error ? error : new Error(errorMessage), "error", {
      component: "ApiClient",
      action: "api_call_failed",
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Creates a timeout promise that rejects after specified milliseconds.
 *
 * @param ms - Timeout duration in milliseconds
 * @param signal - Optional abort signal
 * @returns Promise that rejects on timeout
 */
function createTimeout(ms: number, signal?: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);

    // Clear timeout if request is aborted
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("Request aborted"));
    });
  });
}

/**
 * Wraps an API call with timeout support.
 * Automatically cancels the request if it exceeds the timeout duration.
 *
 * @param apiCall - Async function that makes the API call
 * @param timeoutMs - Timeout duration in milliseconds (default: 30000)
 * @param signal - Optional abort signal for manual cancellation
 * @returns API result with data or error
 *
 * @example
 * ```ts
 * const abortController = new AbortController();
 *
 * const result = await apiWithTimeout(
 *   () => api.api.users.get(),
 *   10000, // 10 second timeout
 *   abortController.signal
 * );
 *
 * // Cancel the request manually
 * abortController.abort();
 * ```
 */
export async function apiWithTimeout<T>(
  apiCall: () => Promise<{ data?: T; error?: unknown }>,
  timeoutMs: number = 30000,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  try {
    // Race between API call and timeout
    const response = await Promise.race([apiCall(), createTimeout(timeoutMs, signal)]);

    // Handle Eden treaty response format
    if (response.error) {
      const errorMessage = getErrorMessage(response.error);
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    // Log timeout or abort errors
    logError(error instanceof Error ? error : new Error(errorMessage), "warning", {
      component: "ApiClient",
      action: "api_timeout_or_abort",
      metadata: { timeoutMs },
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Combines retry logic with timeout support for maximum resilience.
 *
 * @param apiCall - Async function that makes the API call
 * @param options - Configuration options
 * @returns API result with data or error
 *
 * @example
 * ```ts
 * const result = await apiWithRetryAndTimeout(
 *   () => api.api.users.get(),
 *   {
 *     maxAttempts: 3,
 *     timeoutMs: 10000,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry ${attempt}: ${error}`);
 *     }
 *   }
 * );
 * ```
 */
export async function apiWithRetryAndTimeout<T>(
  apiCall: () => Promise<{ data?: T; error?: unknown }>,
  options: RetryOptions & { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ApiResult<T>> {
  const { timeoutMs = 30000, signal, ...retryOptions } = options;

  return apiWithRetry(
    () =>
      apiWithTimeout(apiCall, timeoutMs, signal).then((result) => {
        if (!result.success) {
          throw new Error(result.error);
        }
        return { data: result.data };
      }),
    retryOptions,
  );
}

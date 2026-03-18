/**
 * Circuit Breaker for AI Provider Calls
 *
 * Implements the circuit breaker pattern to prevent cascading failures
 * when external AI providers (OpenRouter) experience slowness or outages.
 *
 * States:
 * - CLOSED: Normal operation. Requests flow through to the provider.
 * - OPEN: Provider is failing. Requests are short-circuited with graceful degradation.
 * - HALF_OPEN: Testing if provider has recovered. Limited requests allowed.
 *
 * Features:
 * - Configurable failure threshold
 * - Configurable open/reset timeout
 * - Configurable execution timeout per request
 * - Safe concurrent behavior
 * - Structured logging for observability
 * - Graceful degradation on failures
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger({ module: "ai-circuit-breaker" });

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting reset (open state → half-open) */
  resetTimeoutMs: number;
  /** Execution timeout for individual provider calls in milliseconds */
  executionTimeoutMs: number;
  /** Number of successful calls in half-open state before closing circuit */
  halfOpenSuccessThreshold?: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastStateChangeTime: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreakerOpenError extends Error {
  readonly code = "CIRCUIT_BREAKER_OPEN";
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("AI provider temporarily unavailable. Please try again later.");
    this.name = "CircuitBreakerOpenError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class CircuitBreakerTimeoutError extends Error {
  readonly code = "CIRCUIT_BREAKER_TIMEOUT";

  constructor(_operation: string, timeoutMs: number) {
    super(`AI provider request timed out after ${timeoutMs}ms`);
    this.name = "CircuitBreakerTimeoutError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastStateChangeTime: number = Date.now();
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  constructor(
    private readonly config: CircuitBreakerConfig,
    private readonly providerName: string = "openrouter",
    private readonly operationName: string = "ai-call",
  ) {}

  /**
   * Execute a function through the circuit breaker.
   * Returns the result of the function if successful.
   * Throws CircuitBreakerOpenError if circuit is open.
   * Throws CircuitBreakerTimeoutError if execution times out.
   * Throws the original error if the function fails.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === "OPEN") {
      const timeSinceLastChange = Date.now() - this.lastStateChangeTime;
      if (timeSinceLastChange >= this.config.resetTimeoutMs) {
        this.transitionTo("HALF_OPEN");
      }
    }

    // Short-circuit if circuit is OPEN
    if (this.state === "OPEN") {
      const retryAfterMs = this.config.resetTimeoutMs - (Date.now() - this.lastStateChangeTime);
      logger.warn(
        {
          provider: this.providerName,
          operation: this.operationName,
          retryAfterMs,
          failureCount: this.failureCount,
        },
        "Circuit breaker OPEN - short-circuiting request",
      );
      throw new CircuitBreakerOpenError(Math.max(0, retryAfterMs));
    }

    // Execute with timeout
    const executionTimeout = this.createExecutionTimeout();
    const startTime = Date.now();

    try {
      const result = await Promise.race([fn(), executionTimeout.promise]);
      executionTimeout.cancel();

      this.onSuccess();
      this.totalSuccesses++;
      return result;
    } catch (error) {
      executionTimeout.cancel();
      const duration = Date.now() - startTime;

      // Don't count timeout as a failure for circuit state purposes
      if (error instanceof CircuitBreakerTimeoutError) {
        logger.warn(
          {
            provider: this.providerName,
            operation: this.operationName,
            durationMs: duration,
          },
          "Circuit breaker execution timeout",
        );
        throw error;
      }

      this.onFailure();
      this.totalFailures++;
      throw error;
    }
  }

  /**
   * Get current circuit breaker statistics.
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Manually open the circuit (e.g., from admin panel).
   */
  open(): void {
    this.transitionTo("OPEN");
    logger.warn(
      {
        provider: this.providerName,
        operation: this.operationName,
      },
      "Circuit breaker manually opened",
    );
  }

  /**
   * Manually close the circuit (e.g., from admin panel).
   */
  close(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.transitionTo("CLOSED");
    logger.info(
      {
        provider: this.providerName,
        operation: this.operationName,
      },
      "Circuit breaker manually closed",
    );
  }

  /**
   * Reset the circuit breaker to initial state.
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.transitionTo("CLOSED");
    logger.info(
      {
        provider: this.providerName,
        operation: this.operationName,
      },
      "Circuit breaker reset",
    );
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      const threshold = this.config.halfOpenSuccessThreshold ?? 1;
      if (this.successCount >= threshold) {
        this.successCount = 0; // Reset success count on close
        this.transitionTo("CLOSED");
        logger.info(
          {
            provider: this.providerName,
            operation: this.operationName,
            successCount: this.successCount,
            threshold,
          },
          "Circuit breaker CLOSED - provider recovered",
        );
      }
    } else if (this.state === "CLOSED") {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      // Any failure in half-open state immediately opens the circuit
      this.transitionTo("OPEN");
      logger.error(
        {
          provider: this.providerName,
          operation: this.operationName,
          failureCount: this.failureCount,
        },
        "Circuit breaker OPEN - half-open test failed",
      );
    } else if (this.state === "CLOSED" && this.failureCount >= this.config.failureThreshold) {
      this.transitionTo("OPEN");
      logger.error(
        {
          provider: this.providerName,
          operation: this.operationName,
          failureCount: this.failureCount,
          threshold: this.config.failureThreshold,
        },
        "Circuit breaker OPEN - failure threshold exceeded",
      );
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChangeTime = Date.now();

    if (oldState !== newState) {
      logger.info(
        {
          provider: this.providerName,
          operation: this.operationName,
          from: oldState,
          to: newState,
        },
        "Circuit breaker state transition",
      );
    }
  }

  private createExecutionTimeout(): {
    promise: Promise<never>;
    cancel: () => void;
  } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let _rejectFn: ((error: CircuitBreakerTimeoutError) => void) | null = null;

    const promise = new Promise<never>((_resolve, reject) => {
      _rejectFn = reject;
      timeoutId = setTimeout(() => {
        reject(new CircuitBreakerTimeoutError(this.operationName, this.config.executionTimeoutMs));
      }, this.config.executionTimeoutMs);
    });

    return {
      promise,
      cancel: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        _rejectFn = null;
      },
    };
  }
}

/**
 * Default circuit breaker configuration for production use.
 * These values can be overridden via environment variables.
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Open after 5 consecutive failures
  resetTimeoutMs: 60_000, // Try again after 60 seconds
  executionTimeoutMs: 30_000, // Individual request timeout: 30 seconds
  halfOpenSuccessThreshold: 2, // Need 2 successes in half-open to close
};

/**
 * Create a circuit breaker with the given configuration.
 */
export function createCircuitBreaker(
  config: Partial<CircuitBreakerConfig> = {},
  providerName?: string,
  operationName?: string,
): CircuitBreaker {
  const mergedConfig: CircuitBreakerConfig = {
    ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
    ...config,
  };

  return new CircuitBreaker(mergedConfig, providerName, operationName);
}

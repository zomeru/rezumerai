/**
 * Graceful Shutdown Handler
 *
 * Centralized shutdown logic for safe, predictable process termination.
 * Handles SIGTERM/SIGINT signals and ensures:
 * - No new requests are accepted
 * - In-flight requests are allowed to complete (with timeout)
 * - Job queue is drained safely
 * - Database connections are properly disconnected
 * - Process exits cleanly or forcefully after timeout
 *
 * @example
 * ```ts
 * import { gracefulShutdown, ShutdownManager } from "@/lib/graceful-shutdown";
 *
 * // Initialize at application startup
 * const shutdownManager = new ShutdownManager({
 *   shutdownTimeoutMs: 30000,
 * });
 *
 * // Register signal handlers
 * shutdownManager.registerHandlers();
 *
 * // Or use the default singleton
 * gracefulShutdown.registerHandlers();
 * ```
 */

import { prisma } from "@rezumerai/database";
import { getServerEnv } from "@/env";
import { logger } from "@/lib/logger";
import { drainJobQueue, getActiveJobsCount } from "../elysia-api/modules/jobs/queue";

/**
 * Shutdown state interface
 */
export interface ShutdownState {
  /** Whether shutdown has been initiated */
  isShuttingDown: boolean;
  /** Number of active in-flight requests */
  activeRequests: number;
  /** Number of active jobs being processed */
  activeJobs: number;
  /** Whether database is still connected */
  databaseConnected: boolean;
  /** Whether job queue is still running */
  jobQueueRunning: boolean;
  /** Shutdown start timestamp */
  shutdownStartedAt: number | null;
}

/**
 * Shutdown configuration
 */
export interface ShutdownConfig {
  /** Timeout in milliseconds before forced exit (default: 30s) */
  shutdownTimeoutMs: number;
  /** Whether to wait for in-flight requests (default: true) */
  drainRequests: boolean;
  /** Whether to drain job queue (default: true) */
  drainJobs: boolean;
}

/**
 * ShutdownManager - handles graceful shutdown lifecycle
 */
export class ShutdownManager {
  private isShuttingDown = false;
  private activeRequests = 0;
  private shutdownStartedAt: number | null = null;
  private config: ShutdownConfig;
  private shutdownPromise: Promise<void> | null = null;

  constructor(config?: Partial<ShutdownConfig>) {
    const env = getServerEnv();
    this.config = {
      shutdownTimeoutMs: parseInt(env.SHUTDOWN_TIMEOUT_MS, 10) || 30000,
      drainRequests: true,
      drainJobs: true,
      ...config,
    };
  }

  /**
   * Get current shutdown state
   */
  getState(): ShutdownState {
    return {
      isShuttingDown: this.isShuttingDown,
      activeRequests: this.activeRequests,
      activeJobs: getActiveJobsCount(),
      databaseConnected: true, // Will be updated during shutdown
      jobQueueRunning: true, // Will be updated during shutdown
      shutdownStartedAt: this.shutdownStartedAt,
    };
  }

  /**
   * Check if shutdown is in progress
   */
  getIsShuttingDown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Increment active request count
   * Returns false if shutdown is in progress (request should be rejected)
   */
  startRequest(): boolean {
    if (this.isShuttingDown) {
      return false;
    }
    this.activeRequests++;
    return true;
  }

  /**
   * Decrement active request count
   */
  endRequest(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
  }

  /**
   * Get active request count
   */
  getActiveRequests(): number {
    return this.activeRequests;
  }

  /**
   * Register SIGTERM and SIGINT handlers
   */
  registerHandlers(): void {
    process.on("SIGTERM", () => this.initiateShutdown("SIGTERM"));
    process.on("SIGINT", () => this.initiateShutdown("SIGINT"));

    logger.info(
      {
        shutdownTimeoutMs: this.config.shutdownTimeoutMs,
      },
      "Graceful shutdown handlers registered",
    );
  }

  /**
   * Initiate graceful shutdown
   */
  private async initiateShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn({ signal }, "Shutdown already in progress, forcing exit");
      // Force exit if already shutting down
      setTimeout(() => {
        logger.error({ signal }, "Forced exit after duplicate shutdown signal");
        process.exit(1);
      }, 1000);
      return;
    }

    this.isShuttingDown = true;
    this.shutdownStartedAt = Date.now();

    logger.info(
      {
        signal,
        activeRequests: this.activeRequests,
        activeJobs: getActiveJobsCount(),
        timeoutMs: this.config.shutdownTimeoutMs,
      },
      "Graceful shutdown initiated",
    );

    // Create shutdown promise for tracking
    this.shutdownPromise = this.performShutdown(signal);

    // Set up timeout for forced exit
    const timeoutHandle = setTimeout(() => {
      logger.error(
        {
          signal,
          elapsedMs: Date.now() - (this.shutdownStartedAt ?? 0),
          activeRequests: this.activeRequests,
          activeJobs: getActiveJobsCount(),
        },
        "Graceful shutdown timeout exceeded, forcing exit",
      );
      process.exit(1);
    }, this.config.shutdownTimeoutMs);

    try {
      await this.shutdownPromise;
      clearTimeout(timeoutHandle);
      logger.info({ elapsedMs: Date.now() - (this.shutdownStartedAt ?? 0) }, "Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      clearTimeout(timeoutHandle);
      logger.error({ err: error, elapsedMs: Date.now() - (this.shutdownStartedAt ?? 0) }, "Shutdown failed");
      process.exit(1);
    }
  }

  /**
   * Perform the actual shutdown sequence
   */
  private async performShutdown(signal: string): Promise<void> {
    const shutdownStep = (step: string, fn: () => Promise<void>) =>
      fn().catch((error) => {
        logger.warn({ err: error, step }, "Shutdown step failed, continuing");
      });

    // Step 1: Stop accepting new requests (already done via isShuttingDown flag)
    logger.info({ activeRequests: this.activeRequests }, "Stopping new requests");

    // Step 2: Wait for in-flight requests to drain
    if (this.config.drainRequests && this.activeRequests > 0) {
      logger.info({ count: this.activeRequests }, "Draining in-flight requests");
      await this.drainRequests();
    }

    // Step 3: Stop job queue and wait for active jobs
    if (this.config.drainJobs) {
      logger.info({ activeJobs: getActiveJobsCount() }, "Stopping job queue");
      await shutdownStep("job-queue-drain", async () => {
        await drainJobQueue();
      });
    }

    // Step 4: Disconnect database
    logger.info("Disconnecting database");
    await shutdownStep("database-disconnect", async () => {
      await prisma.$disconnect();
    });

    logger.info(
      {
        signal,
        elapsedMs: Date.now() - (this.shutdownStartedAt ?? 0),
      },
      "Shutdown sequence complete",
    );
  }

  /**
   * Wait for all active requests to complete
   */
  private async drainRequests(): Promise<void> {
    const pollIntervalMs = 50;
    const maxWaitMs = this.config.shutdownTimeoutMs;
    const startedAt = Date.now();

    while (this.activeRequests > 0) {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= maxWaitMs) {
        logger.warn(
          {
            activeRequests: this.activeRequests,
            elapsedMs: elapsed,
          },
          "Request drain timeout, proceeding with shutdown",
        );
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (this.activeRequests === 0) {
      logger.info({ elapsedMs: Date.now() - startedAt }, "All requests drained");
    }
  }

  /**
   * Wait for shutdown to complete (if initiated)
   */
  async waitForShutdown(): Promise<void> {
    if (this.shutdownPromise) {
      await this.shutdownPromise;
    }
  }
}

/**
 * Default singleton instance for application-wide use
 */
export const gracefulShutdown = new ShutdownManager();

/**
 * Middleware factory for tracking requests during shutdown
 *
 * @example
 * ```ts
 * .use(shutdownMiddleware())
 * ```
 */
export function shutdownMiddleware() {
  const manager = gracefulShutdown;

  return async (ctx: { set: { status: number } }, next: () => Promise<void>) => {
    // Check if shutting down
    if (manager.getIsShuttingDown()) {
      // Return 503 Service Unavailable
      ctx.set.status = 503;
      return {
        error: "Service Unavailable",
        message: "Server is shutting down. Please try again later.",
        retryAfter: 30,
      };
    }

    // Track this request
    if (!manager.startRequest()) {
      // Shutdown started between check and start
      ctx.set.status = 503;
      return {
        error: "Service Unavailable",
        message: "Server is shutting down. Please try again later.",
        retryAfter: 30,
      };
    }

    try {
      await next();
    } finally {
      // Always decrement on completion
      manager.endRequest();
    }
  };
}

export default gracefulShutdown;

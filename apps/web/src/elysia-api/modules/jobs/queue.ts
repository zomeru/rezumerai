/**
 * Production-grade job queue using pg-boss.
 *
 * Why pg-boss:
 * - Uses existing PostgreSQL infrastructure (no Redis needed)
 * - Multi-instance safe via PostgreSQL advisory locks
 * - Built-in retries, exponential backoff, dead-letter handling
 * - Transactional job publishing
 * - Simple operational model (one less service to manage)
 *
 * Tradeoffs vs alternatives:
 * - BullMQ: Would require Redis deployment, more complex infra
 * - Inngest: External service dependency, less control, vendor lock-in
 */

import { prisma } from "@rezumerai/database";
import { PgBoss } from "pg-boss";
import { getServerEnv } from "@/env";
import { logger } from "@/lib/logger";

// Extract database connection from Prisma for pg-boss
function getDatabaseConnection(): string {
  return getServerEnv().DATABASE_URL;
}

// Job queue names - single source of truth
export const JobName = {
  // Embedding generation jobs
  GENERATE_EMBEDDINGS: "generate-embeddings",
  REINDEX_CONVERSATION: "reindex-conversation",

  // Observability jobs
  RECORD_ANALYTICS: "record-analytics",
  RECORD_AUDIT_LOG: "record-audit-log",

  // Scheduled/maintenance jobs
  ERROR_LOG_RETENTION_CLEANUP: "error-log-retention-cleanup",

  // AI side-effect jobs
  AI_PERSISTENCE_SIDEEFFECT: "ai-persistence-sideeffect",
} as const;

export type JobName = (typeof JobName)[keyof typeof JobName];

// Job priority levels
export const JobPriority = {
  LOW: 10,
  NORMAL: 5,
  HIGH: 1,
  CRITICAL: 0,
} as const;

// Retry configuration
export const RetryConfig = {
  // Max attempts before dead-letter
  MAX_ATTEMPTS: 5,
  // Initial backoff in seconds
  INITIAL_BACKOFF_SECONDS: 1,
  // Max backoff in seconds (5 minutes)
  MAX_BACKOFF_SECONDS: 300,
} as const;

// Job timeout configuration
export const JobTimeoutConfig = {
  // Default timeout in seconds
  DEFAULT_TIMEOUT_SECONDS: 60,
  // Long-running job timeout (embeddings, etc.)
  LONG_TIMEOUT_SECONDS: 300,
  // Very long-running job timeout (bulk operations)
  VERY_LONG_TIMEOUT_SECONDS: 600,
} as const;

// Singleton instance - safe in multi-module imports
let bossInstance: PgBoss | null = null;

// Metrics tracking
interface QueueMetrics {
  jobsPublished: number;
  jobsCompleted: number;
  jobsFailed: number;
  totalProcessingTimeMs: number;
  lastJobPublishedAt: number | null;
  lastJobCompletedAt: number | null;
}

const metrics: Map<JobName, QueueMetrics> = new Map();

function initializeMetrics(): void {
  for (const jobName of Object.values(JobName)) {
    metrics.set(jobName, {
      jobsPublished: 0,
      jobsCompleted: 0,
      jobsFailed: 0,
      totalProcessingTimeMs: 0,
      lastJobPublishedAt: null,
      lastJobCompletedAt: null,
    });
  }
}

function incrementMetric(jobName: JobName, field: keyof QueueMetrics, value: number = 1): void {
  const jobMetrics = metrics.get(jobName);
  if (jobMetrics) {
    (jobMetrics[field] as number) = ((jobMetrics[field] as number) ?? 0) + value;
  }
}

function setMetric(jobName: JobName, field: keyof QueueMetrics, value: number | null): void {
  const jobMetrics = metrics.get(jobName);
  if (jobMetrics) {
    jobMetrics[field] = value as never;
  }
}

/**
 * Get or create the pg-boss instance.
 * Must be initialized before use.
 */
export function getBoss(): PgBoss {
  if (!bossInstance) {
    throw new Error("Job queue not initialized. Call initializeJobQueue() before using jobs.");
  }
  return bossInstance;
}

/**
 * Check if job queue is initialized.
 */
export function isJobQueueInitialized(): boolean {
  return bossInstance !== null;
}

/**
 * Initialize the job queue.
 * Must be called once at application startup.
 */
export async function initializeJobQueue(): Promise<PgBoss> {
  if (bossInstance) {
    return bossInstance;
  }

  const connectionString = getDatabaseConnection();

  bossInstance = new PgBoss({
    // Database connection
    connectionString,

    // Schema for pg-boss tables (keeps them organized)
    schema: "pgboss",

    // Connection pool settings
    max: 10,

    // Monitoring interval
    monitorIntervalSeconds: 60,

    // Migration management
    migrate: true, // Auto-create pg-boss tables
  });

  // Handle lifecycle events
  bossInstance.on("error", (error: Error) => {
    logger.error({ err: error }, "Job queue error");
  });

  bossInstance.on("stopped", () => {
    logger.info({}, "Job queue stopped");
  });

  // Start the queue
  await bossInstance.start();

  // Initialize metrics tracking
  initializeMetrics();

  // Create all known queues
  await createQueues();

  logger.info({}, "Job queue initialized and started");

  return bossInstance;
}

/**
 * Create all known job queues.
 * pg-boss v12 requires queues to be created before workers can subscribe.
 */
async function createQueues(): Promise<void> {
  if (!bossInstance) {
    return;
  }

  const queueNames = Object.values(JobName);

  try {
    await Promise.all(
      queueNames.map((name) =>
        bossInstance?.createQueue(name, {
          retryLimit: RetryConfig.MAX_ATTEMPTS,
          retryDelay: RetryConfig.INITIAL_BACKOFF_SECONDS,
          retryBackoff: true,
          // Queue retention settings
          expireInSeconds: JobTimeoutConfig.VERY_LONG_TIMEOUT_SECONDS,
          retentionSeconds: 86400 * 14, // 14 days
          deleteAfterSeconds: 86400 * 7, // 7 days
        }),
      ),
    );
    logger.info({ queueCount: queueNames.length }, "Created job queues");
  } catch (error) {
    // Queues may already exist, which is fine
    const message = error instanceof Error ? error.message : "Unknown error";
    if (!message.includes("already exists")) {
      logger.warn({ error: message }, "Job queue creation warning");
    }
  }
}

/**
 * Gracefully shut down the job queue.
 */
export async function shutdownJobQueue(): Promise<void> {
  if (bossInstance) {
    await bossInstance.stop();
    bossInstance = null;
    logger.info({}, "Job queue shut down");
  }
}

/**
 * Publish a job to the queue.
 *
 * @param name - Job name from JobName enum
 * @param data - Job payload (must be JSON-serializable)
 * @param options - Optional job configuration
 * @returns Job ID if published, null if queue not initialized or rate limited
 */
export async function publishJob<T extends Record<string, unknown>>(
  name: JobName,
  data: T,
  options?: {
    priority?: number;
    retryLimit?: number;
    retryDelay?: number;
    retryBackoff?: boolean;
    timeoutSeconds?: number;
    singletonKey?: string;
    singletonSeconds?: number;
    startAfter?: Date | string;
  },
): Promise<string | null> {
  // Check rate limit (lazy require to avoid circular dependency)
  const { checkRateLimit } = require("./rate-limit");
  const rateLimitResult = checkRateLimit(name);

  if (!rateLimitResult.allowed) {
    logger.warn(
      { jobName: name, reason: rateLimitResult.reason, retryAfterSeconds: rateLimitResult.retryAfterSeconds },
      "Job rate limited",
    );
    return null;
  }

  const boss = getBoss();

  // Calculate dynamic priority if not explicitly provided
  let priority = options?.priority;
  if (priority === undefined) {
    // Get current queue depth for priority calculation via raw query
    const pendingResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int as count FROM pgboss.job WHERE name = $1 AND state = 'created'`,
      name,
    );
    const queueDepth = pendingResult[0]?.count ?? 0;
    // Lazy require to avoid circular dependency
    const { calculatePriority } = require("./priority");
    priority = calculatePriority(name, queueDepth);
  }

  const jobId = await boss.send(name, data, {
    priority: priority ?? JobPriority.NORMAL,
    retryLimit: options?.retryLimit ?? RetryConfig.MAX_ATTEMPTS,
    retryDelay: options?.retryDelay ?? RetryConfig.INITIAL_BACKOFF_SECONDS,
    retryBackoff: options?.retryBackoff ?? true,
    singletonKey: options?.singletonKey,
    singletonSeconds: options?.singletonSeconds,
    startAfter: options?.startAfter,
  } as Parameters<typeof boss.send>[2]);

  if (jobId) {
    incrementMetric(name, "jobsPublished");
    setMetric(name, "lastJobPublishedAt", Date.now());
  }

  return jobId ?? null;
}

/**
 * Publish multiple jobs in a batch.
 */
export async function publishJobs<T extends Record<string, unknown>>(
  jobs: Array<{
    name: JobName;
    data: T;
    options?: Parameters<typeof publishJob>[2];
  }>,
): Promise<void> {
  const boss = getBoss();

  // Send jobs one by one since batch API has different signature in v12
  for (const job of jobs) {
    await boss.send(job.name, job.data, {
      priority: job.options?.priority ?? JobPriority.NORMAL,
      retryLimit: job.options?.retryLimit ?? RetryConfig.MAX_ATTEMPTS,
      retryDelay: job.options?.retryDelay ?? RetryConfig.INITIAL_BACKOFF_SECONDS,
      retryBackoff: job.options?.retryBackoff ?? true,
      singletonKey: job.options?.singletonKey,
      singletonSeconds: job.options?.singletonSeconds,
      startAfter: job.options?.startAfter,
    } as Parameters<typeof boss.send>[2]);
  }
}

/**
 * Schedule a job to run at a specific time.
 */
export async function scheduleJob<T extends Record<string, unknown>>(
  name: JobName,
  data: T,
  runAt: Date | string,
  options?: Omit<Parameters<typeof publishJob>[2], "startAfter">,
): Promise<string | null> {
  return publishJob(name, data, {
    ...options,
    startAfter: runAt,
  });
}

/**
 * Work handler type for job processors.
 */
export type WorkHandler<T = Record<string, unknown>> = (job: { id: string; data: T; name: string }) => Promise<unknown>;

/**
 * Register a job worker.
 *
 * @param name - Job name to handle
 * @param handler - Async function to process jobs
 * @param options - Worker configuration
 */
export async function registerWorker(
  name: JobName,
  handler: WorkHandler,
  options?: {
    batchSize?: number;
    includeMetadata?: boolean;
  },
): Promise<void> {
  const boss = getBoss();

  await boss.work(
    name,
    {
      batchSize: options?.batchSize ?? 1,
      includeMetadata: options?.includeMetadata ?? true,
    },
    async (jobs: { id: string; data: Record<string, unknown>; name: string }[]) => {
      // Process jobs one at a time even in batch mode for better error handling
      const results = await Promise.allSettled(
        jobs.map((job: { id: string; data: Record<string, unknown>; name: string }) => {
          const startTime = Date.now();

          // Register job for timeout tracking (lazy require to avoid circular dependency)
          const { registerActiveJob } = require("./timeouts");
          registerActiveJob(job.id, job.name);

          return handler(job)
            .then((result) => {
              const duration = Date.now() - startTime;
              logger.info(
                {
                  jobId: job.id,
                  jobName: name,
                  durationMs: duration,
                },
                "Job completed",
              );

              // Complete timeout tracking (lazy require)
              const { completeActiveJob } = require("./timeouts");
              completeActiveJob(job.id, duration);

              // Track completion metrics
              incrementMetric(name, "jobsCompleted");
              incrementMetric(name, "totalProcessingTimeMs", duration);
              setMetric(name, "lastJobCompletedAt", Date.now());

              return result;
            })
            .catch((error) => {
              const duration = Date.now() - startTime;

              // Fail timeout tracking (lazy require)
              const { failActiveJob } = require("./timeouts");
              failActiveJob(job.id, error?.message ?? "Unknown error");

              // Track failure metrics
              incrementMetric(name, "jobsFailed");
              incrementMetric(name, "totalProcessingTimeMs", duration);
              setMetric(name, "lastJobCompletedAt", Date.now());

              logger.error(
                {
                  jobId: job.id,
                  jobName: name,
                  durationMs: duration,
                  err: error,
                },
                "Job failed",
              );
              throw error; // Re-throw for pg-boss retry handling
            });
        }),
      );

      // Check for failures
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        // Log but don't throw - pg-boss handles retry based on throw
        logger.error(
          {
            jobName: name,
            failureCount: failures.length,
          },
          "Job batch had failures",
        );
      }

      return;
    },
  );

  logger.info({ jobName: name }, "Worker registered");
}

/**
 * Get job queue statistics including metrics.
 */
export async function getQueueStats(): Promise<
  Record<
    string,
    {
      // pg-boss queue stats (placeholder for future implementation)
      pending: number;
      active: number;
      completed: number;
      failed: number;
      retry: number;
      // Application metrics
      jobsPublished: number;
      jobsCompleted: number;
      jobsFailed: number;
      totalProcessingTimeMs: number;
      averageProcessingTimeMs: number;
      lastJobPublishedAt: string | null;
      lastJobCompletedAt: string | null;
      hitRate: number | null;
    }
  >
> {
  const stats: Record<
    string,
    {
      pending: number;
      active: number;
      completed: number;
      failed: number;
      retry: number;
      jobsPublished: number;
      jobsCompleted: number;
      jobsFailed: number;
      totalProcessingTimeMs: number;
      averageProcessingTimeMs: number;
      lastJobPublishedAt: string | null;
      lastJobCompletedAt: string | null;
      hitRate: number | null;
    }
  > = {};

  for (const jobName of Object.values(JobName)) {
    const jobMetrics = metrics.get(jobName) ?? {
      jobsPublished: 0,
      jobsCompleted: 0,
      jobsFailed: 0,
      totalProcessingTimeMs: 0,
      lastJobPublishedAt: null,
      lastJobCompletedAt: null,
    };

    const averageProcessingTimeMs =
      jobMetrics.jobsCompleted > 0 ? Math.round(jobMetrics.totalProcessingTimeMs / jobMetrics.jobsCompleted) : 0;

    // Get pending count from pg-boss via raw query
    const pendingResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int as count FROM pgboss.job WHERE name = $1 AND state = 'created'`,
      jobName,
    );
    const pending = pendingResult[0]?.count ?? 0;

    stats[jobName] = {
      // pg-boss queue stats
      pending,
      active: 0,
      completed: jobMetrics.jobsCompleted,
      failed: jobMetrics.jobsFailed,
      retry: 0,
      // Application metrics
      jobsPublished: jobMetrics.jobsPublished,
      jobsCompleted: jobMetrics.jobsCompleted,
      jobsFailed: jobMetrics.jobsFailed,
      totalProcessingTimeMs: jobMetrics.totalProcessingTimeMs,
      averageProcessingTimeMs,
      lastJobPublishedAt: jobMetrics.lastJobPublishedAt ? new Date(jobMetrics.lastJobPublishedAt).toISOString() : null,
      lastJobCompletedAt: jobMetrics.lastJobCompletedAt ? new Date(jobMetrics.lastJobCompletedAt).toISOString() : null,
      hitRate: null, // Will be populated by cache stats endpoint
    };
  }

  return stats;
}

/**
 * Get cache statistics for RAG query embedding cache.
 */
export function getCacheStats(): {
  size: number;
  maxEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
} {
  // Lazy require to avoid circular dependency
  const { getQueryEmbeddingCache } = require("../ai/memory/query-embedding-cache");
  const cache = getQueryEmbeddingCache();
  return cache.getStats();
}

/**
 * Cancel a pending job by name and ID.
 */
export async function cancelJob(jobName: JobName, jobId: string): Promise<void> {
  const boss = getBoss();
  await boss.cancel(jobName, jobId);
}

/**
 * Retry a failed job by name and ID.
 */
export async function retryJob(jobName: JobName, jobId: string): Promise<void> {
  const boss = getBoss();
  await boss.retry(jobName, jobId);
}

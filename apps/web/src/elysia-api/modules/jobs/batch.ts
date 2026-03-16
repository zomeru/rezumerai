/**
 * Batch job processing.
 *
 * Groups similar jobs together to reduce database round-trips.
 * Supports configurable batch size and flush interval.
 */

import { createLogger } from "@/lib/logger";
import { type JobName, publishJob } from "./queue";

const logger = createLogger({ module: "batch" });

export interface BatchConfig {
  /** Maximum batch size before flushing */
  maxBatchSize: number;
  /** Maximum time to wait before flushing (ms) */
  flushIntervalMs: number;
}

interface BatchItem<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T;
  resolve: (jobId: string | null) => void;
  reject: (error: Error) => void;
  queuedAt: number;
}

interface BatchState<T extends Record<string, unknown> = Record<string, unknown>> {
  items: BatchItem<T>[];
  flushTimer: NodeJS.Timeout | null;
}

const DEFAULT_BATCH_CONFIG: Record<JobName, BatchConfig> = {
  "generate-embeddings": {
    maxBatchSize: 10,
    flushIntervalMs: 5000,
  },
  "reindex-conversation": {
    maxBatchSize: 5,
    flushIntervalMs: 10000,
  },
  "record-analytics": {
    maxBatchSize: 50,
    flushIntervalMs: 1000,
  },
  "record-audit-log": {
    maxBatchSize: 25,
    flushIntervalMs: 2000,
  },
  "error-log-retention-cleanup": {
    maxBatchSize: 1,
    flushIntervalMs: 1000,
  },
  "ai-persistence-sideeffect": {
    maxBatchSize: 10,
    flushIntervalMs: 3000,
  },
};

const batchStates: Map<JobName, BatchState> = new Map();
const config: Map<JobName, BatchConfig> = new Map(
  Object.entries(DEFAULT_BATCH_CONFIG) as Array<[JobName, BatchConfig]>,
);

// Initialize batch states
for (const jobName of Object.keys(DEFAULT_BATCH_CONFIG) as JobName[]) {
  batchStates.set(jobName, {
    items: [],
    flushTimer: null,
  });
}

/**
 * Configure batch processing for a job type.
 */
export function configureBatch(jobName: JobName, newConfig: Partial<BatchConfig>): void {
  const current = config.get(jobName);
  if (current) {
    config.set(jobName, { ...current, ...newConfig });
    logger.info({ jobName, config: config.get(jobName) }, "Batch configuration updated");
  }
}

/**
 * Get batch configuration for a job type.
 */
export function getBatchConfig(jobName: JobName): BatchConfig {
  return config.get(jobName) ?? DEFAULT_BATCH_CONFIG[jobName];
}

/**
 * Queue a job for batch processing.
 * Returns a promise that resolves when the job is actually published.
 */
export async function queueBatchJob<T extends Record<string, unknown>>(
  jobName: JobName,
  data: T,
): Promise<string | null> {
  const state = batchStates.get(jobName);
  const jobConfig = config.get(jobName);

  if (!state || !jobConfig) {
    // Fall back to immediate publishing if batch not configured
    return publishJob(jobName, data);
  }

  return new Promise<string | null>((resolve, reject) => {
    const item: BatchItem<T> = {
      data,
      resolve,
      reject,
      queuedAt: Date.now(),
    };

    state.items.push(item);

    // Start flush timer if not already running
    if (!state.flushTimer) {
      state.flushTimer = setTimeout(() => {
        flushBatch(jobName).catch((error) => {
          logger.error({ err: error, jobName }, "Failed to flush batch");
        });
      }, jobConfig.flushIntervalMs);
    }

    // Flush immediately if batch is full
    if (state.items.length >= jobConfig.maxBatchSize) {
      if (state.flushTimer) {
        clearTimeout(state.flushTimer);
        state.flushTimer = null;
      }
      flushBatch(jobName).catch((error) => {
        logger.error({ err: error, jobName }, "Failed to flush batch");
      });
    }
  });
}

/**
 * Flush a batch of jobs.
 */
async function flushBatch(jobName: JobName): Promise<void> {
  const state = batchStates.get(jobName);

  if (!state || state.items.length === 0) {
    return;
  }

  const items = [...state.items];
  state.items = [];
  state.flushTimer = null;

  logger.debug({ jobName, itemCount: items.length }, "Flushing batch");

  // Publish all jobs in parallel
  const results = await Promise.allSettled(items.map((item) => publishJob(jobName, item.data)));

  // Resolve/reject individual promises
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    const result = results[i];

    if (result?.status === "fulfilled") {
      item.resolve(result.value);
    } else {
      item.reject(result?.reason ?? new Error("Batch publish failed"));
    }
  }
}

/**
 * Flush all pending batches immediately.
 */
export async function flushAllBatches(): Promise<void> {
  const flushPromises = Array.from(batchStates.keys()).map((jobName) => flushBatch(jobName));

  await Promise.all(flushPromises);
}

/**
 * Get batch statistics.
 */
export function getBatchStats(): {
  byJobType: Record<
    JobName,
    {
      pendingItems: number;
      maxBatchSize: number;
      flushIntervalMs: number;
      hasPendingTimer: boolean;
      oldestItemAgeMs: number | null;
    }
  >;
  totalPending: number;
} {
  const byJobType: Record<
    JobName,
    {
      pendingItems: number;
      maxBatchSize: number;
      flushIntervalMs: number;
      hasPendingTimer: boolean;
      oldestItemAgeMs: number | null;
    }
  > = Object.create(null);

  let totalPending = 0;
  const now = Date.now();

  for (const [jobName, state] of batchStates.entries()) {
    const jobConfig = config.get(jobName);
    if (!jobConfig) continue;

    const oldestItemAgeMs = state.items.length > 0 ? now - (state.items[0]?.queuedAt ?? now) : null;

    byJobType[jobName] = {
      pendingItems: state.items.length,
      maxBatchSize: jobConfig.maxBatchSize,
      flushIntervalMs: jobConfig.flushIntervalMs,
      hasPendingTimer: state.flushTimer !== null,
      oldestItemAgeMs: oldestItemAgeMs !== null ? Math.round(oldestItemAgeMs) : null,
    };

    totalPending += state.items.length;
  }

  return {
    byJobType,
    totalPending,
  };
}

/**
 * Clear all batch states (for testing).
 */
export function clearAllBatches(): void {
  for (const state of batchStates.values()) {
    if (state.flushTimer) {
      clearTimeout(state.flushTimer);
      state.flushTimer = null;
    }
    // Reject all pending items
    for (const item of state.items) {
      item.reject(new Error("Batch cleared"));
    }
    state.items = [];
  }
}

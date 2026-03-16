/**
 * Job timeout handling.
 *
 * Tracks job execution time and handles timeouts gracefully.
 * Jobs that exceed their timeout are cancelled and logged.
 */

import { type JobName, JobTimeoutConfig } from "./queue";

interface TimeoutConfig {
  /** Default timeout in seconds */
  defaultTimeoutSeconds: number;
  /** Long-running job timeout in seconds */
  longTimeoutSeconds: number;
  /** Very long-running job timeout in seconds */
  veryLongTimeoutSeconds: number;
  /** Per-job-type timeout overrides */
  jobTimeouts: Partial<Record<JobName, number>>;
}

const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  defaultTimeoutSeconds: JobTimeoutConfig.DEFAULT_TIMEOUT_SECONDS,
  longTimeoutSeconds: JobTimeoutConfig.LONG_TIMEOUT_SECONDS,
  veryLongTimeoutSeconds: JobTimeoutConfig.VERY_LONG_TIMEOUT_SECONDS,
  jobTimeouts: {
    "generate-embeddings": JobTimeoutConfig.LONG_TIMEOUT_SECONDS,
    "reindex-conversation": JobTimeoutConfig.VERY_LONG_TIMEOUT_SECONDS,
    "record-analytics": JobTimeoutConfig.DEFAULT_TIMEOUT_SECONDS,
    "record-audit-log": JobTimeoutConfig.DEFAULT_TIMEOUT_SECONDS,
    "error-log-retention-cleanup": JobTimeoutConfig.LONG_TIMEOUT_SECONDS,
  },
};

interface ActiveJob {
  jobId: string;
  jobName: string;
  startTime: number;
  timeoutSeconds: number;
  timeoutId: NodeJS.Timeout | null;
}

const activeJobs: Map<string, ActiveJob> = new Map();
let config: TimeoutConfig = { ...DEFAULT_TIMEOUT_CONFIG };

/**
 * Configure timeout settings.
 */
export function configureTimeouts(newConfig: Partial<TimeoutConfig>): void {
  config = { ...config, ...newConfig };
  console.log(`[TIMEOUTS] Configuration updated:`, config);
}

/**
 * Get timeout configuration.
 */
export function getTimeoutConfig(): TimeoutConfig {
  return { ...config };
}

/**
 * Get timeout for a specific job type.
 */
export function getJobTimeout(jobName: JobName): number {
  return config.jobTimeouts[jobName] ?? config.defaultTimeoutSeconds;
}

/**
 * Register a job as active with timeout tracking.
 */
export function registerActiveJob(jobId: string, jobName: string, timeoutSeconds?: number): void {
  const timeout = timeoutSeconds ?? getJobTimeout(jobName as JobName);

  const activeJob: ActiveJob = {
    jobId,
    jobName,
    startTime: Date.now(),
    timeoutSeconds: timeout,
    timeoutId: null,
  };

  // Set up timeout timer
  activeJob.timeoutId = setTimeout(() => {
    handleJobTimeout(jobId);
  }, timeout * 1000);

  activeJobs.set(jobId, activeJob);

  console.log(`[TIMEOUTS] Job ${jobName} (${jobId}) registered with ${timeout}s timeout`);
}

/**
 * Mark a job as completed and clear timeout.
 */
export function completeActiveJob(jobId: string, durationMs?: number): void {
  const activeJob = activeJobs.get(jobId);

  if (activeJob) {
    if (activeJob.timeoutId) {
      clearTimeout(activeJob.timeoutId);
    }

    const actualDuration = durationMs ?? Date.now() - activeJob.startTime;
    const timeoutUsed = actualDuration / 1000 / activeJob.timeoutSeconds;

    console.log(
      `[TIMEOUTS] Job ${activeJob.jobName} (${jobId}) completed in ${actualDuration}ms (${(timeoutUsed * 100).toFixed(1)}% of timeout)`,
    );

    activeJobs.delete(jobId);
  }
}

/**
 * Mark a job as failed and clear timeout.
 */
export function failActiveJob(jobId: string, error?: string): void {
  const activeJob = activeJobs.get(jobId);

  if (activeJob) {
    if (activeJob.timeoutId) {
      clearTimeout(activeJob.timeoutId);
    }

    const duration = Date.now() - activeJob.startTime;
    console.log(
      `[TIMEOUTS] Job ${activeJob.jobName} (${jobId}) failed after ${duration}ms: ${error ?? "Unknown error"}`,
    );

    activeJobs.delete(jobId);
  }
}

/**
 * Handle job timeout.
 */
function handleJobTimeout(jobId: string): void {
  const activeJob = activeJobs.get(jobId);

  if (!activeJob) {
    return;
  }

  console.error(`[TIMEOUTS] 🚨 Job ${activeJob.jobName} (${jobId}) timed out after ${activeJob.timeoutSeconds}s`);

  // Remove from active jobs
  activeJobs.delete(jobId);

  // Note: pg-boss will handle the actual timeout and retry logic
  // This is mainly for logging and monitoring
}

/**
 * Get active job statistics.
 */
export function getActiveJobStats(): {
  totalActive: number;
  byJobType: Record<string, number>;
  longestRunning: Array<{
    jobId: string;
    jobName: string;
    durationSeconds: number;
    timeoutSeconds: number;
    percentUsed: number;
  }>;
  approachingTimeout: Array<{
    jobId: string;
    jobName: string;
    durationSeconds: number;
    timeoutSeconds: number;
    percentUsed: number;
  }>;
} {
  const byJobType: Record<string, number> = {};
  const now = Date.now();
  const longestRunning: Array<{
    jobId: string;
    jobName: string;
    durationSeconds: number;
    timeoutSeconds: number;
    percentUsed: number;
  }> = [];
  const approachingTimeout: Array<{
    jobId: string;
    jobName: string;
    durationSeconds: number;
    timeoutSeconds: number;
    percentUsed: number;
  }> = [];

  for (const job of activeJobs.values()) {
    // Count by job type
    byJobType[job.jobName] = (byJobType[job.jobName] ?? 0) + 1;

    // Calculate duration
    const durationSeconds = (now - job.startTime) / 1000;
    const percentUsed = (durationSeconds / job.timeoutSeconds) * 100;

    const jobInfo = {
      jobId: job.jobId,
      jobName: job.jobName,
      durationSeconds: Math.round(durationSeconds),
      timeoutSeconds: job.timeoutSeconds,
      percentUsed: Math.round(percentUsed * 10) / 10,
    };

    longestRunning.push(jobInfo);

    // Check if approaching timeout (>80%)
    if (percentUsed > 80) {
      approachingTimeout.push(jobInfo);
    }
  }

  // Sort by duration (longest first)
  longestRunning.sort((a, b) => b.durationSeconds - a.durationSeconds);

  return {
    totalActive: activeJobs.size,
    byJobType,
    longestRunning: longestRunning.slice(0, 10),
    approachingTimeout,
  };
}

/**
 * Get all active jobs.
 */
export function getActiveJobs(): ActiveJob[] {
  return Array.from(activeJobs.values());
}

/**
 * Clear all active jobs (for testing).
 */
export function clearActiveJobs(): void {
  for (const job of activeJobs.values()) {
    if (job.timeoutId) {
      clearTimeout(job.timeoutId);
    }
  }
  activeJobs.clear();
}

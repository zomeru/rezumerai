/**
 * Job publishing rate limiting.
 *
 * Prevents queue flooding during traffic spikes by limiting
 * the rate at which jobs can be published.
 */

import { createLogger } from "@/lib/logger";
import type { JobName } from "./queue";

const logger = createLogger({ module: "rate-limit" });

export interface RateLimitConfig {
  /** Maximum jobs per window */
  maxJobs: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Enable backpressure when queue depth exceeds this */
  backpressureThreshold: number;
}

interface RateLimitState {
  /** Timestamps of recent job publications */
  timestamps: number[];
  /** Number of rejected jobs due to rate limiting */
  rejectedCount: number;
}

const DEFAULT_CONFIG: Record<JobName, RateLimitConfig> = {
  "generate-embeddings": {
    maxJobs: 50,
    windowSeconds: 60,
    backpressureThreshold: 200,
  },
  "reindex-conversation": {
    maxJobs: 10,
    windowSeconds: 60,
    backpressureThreshold: 50,
  },
  "record-analytics": {
    maxJobs: 200,
    windowSeconds: 60,
    backpressureThreshold: 1000,
  },
  "record-audit-log": {
    maxJobs: 100,
    windowSeconds: 60,
    backpressureThreshold: 500,
  },
  "error-log-retention-cleanup": {
    maxJobs: 5,
    windowSeconds: 60,
    backpressureThreshold: 10,
  },
  "ai-persistence-sideeffect": {
    maxJobs: 30,
    windowSeconds: 60,
    backpressureThreshold: 100,
  },
};

const rateLimitState: Map<JobName, RateLimitState> = new Map();
const config: Map<JobName, RateLimitConfig> = new Map(
  Object.entries(DEFAULT_CONFIG) as Array<[JobName, RateLimitConfig]>,
);

// Initialize state
for (const jobName of Object.keys(DEFAULT_CONFIG) as JobName[]) {
  rateLimitState.set(jobName, {
    timestamps: [],
    rejectedCount: 0,
  });
}

/**
 * Configure rate limiting for a job type.
 */
export function configureRateLimit(jobName: JobName, newConfig: Partial<RateLimitConfig>): void {
  const current = config.get(jobName);
  if (current) {
    config.set(jobName, { ...current, ...newConfig });
    logger.info({ jobName, config: config.get(jobName) }, "Rate limit configuration updated");
  }
}

/**
 * Get rate limit configuration for a job type.
 */
export function getRateLimitConfig(jobName: JobName): RateLimitConfig {
  return config.get(jobName) ?? DEFAULT_CONFIG[jobName];
}

/**
 * Get all rate limit configurations.
 */
export function getAllRateLimitConfigs(): Record<JobName, RateLimitConfig> {
  const result: Record<JobName, RateLimitConfig> = {} as Record<JobName, RateLimitConfig>;
  for (const [jobName, jobConfig] of config.entries()) {
    result[jobName] = { ...jobConfig };
  }
  return result;
}

/**
 * Check if a job can be published (rate limit check).
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(jobName: JobName): {
  allowed: boolean;
  reason?: "rate_limit" | "backpressure";
  retryAfterSeconds?: number;
  currentRate?: number;
  maxRate?: number;
} {
  const jobConfig = config.get(jobName);
  const state = rateLimitState.get(jobName);

  if (!jobConfig || !state) {
    return { allowed: true };
  }

  const now = Date.now();
  const windowMs = jobConfig.windowSeconds * 1000;

  // Clean old timestamps
  state.timestamps = state.timestamps.filter((ts) => now - ts < windowMs);

  // Check rate limit
  if (state.timestamps.length >= jobConfig.maxJobs) {
    state.rejectedCount++;
    const oldestTimestamp = state.timestamps[0] ?? now;
    const retryAfterSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      allowed: false,
      reason: "rate_limit",
      retryAfterSeconds,
      currentRate: state.timestamps.length,
      maxRate: jobConfig.maxJobs,
    };
  }

  // Check backpressure (queue depth)
  // This would need queue depth info from caller
  // For now, we just track the rate

  // Record this publication
  state.timestamps.push(now);

  return {
    allowed: true,
    currentRate: state.timestamps.length,
    maxRate: jobConfig.maxJobs,
  };
}

/**
 * Get rate limit statistics.
 */
export function getRateLimitStats(): {
  byJobType: Record<
    JobName,
    {
      currentRate: number;
      maxRate: number;
      windowSeconds: number;
      rejectedCount: number;
      utilizationPercent: number;
    }
  >;
  totalRejected: number;
} {
  const byJobType: Record<
    JobName,
    {
      currentRate: number;
      maxRate: number;
      windowSeconds: number;
      rejectedCount: number;
      utilizationPercent: number;
    }
  > = Object.create(null);

  let totalRejected = 0;
  const now = Date.now();

  for (const [jobName, jobConfig] of config.entries()) {
    const state = rateLimitState.get(jobName);
    if (!state) continue;

    const windowMs = jobConfig.windowSeconds * 1000;
    const currentRate = state.timestamps.filter((ts) => now - ts < windowMs).length;
    const utilizationPercent = (currentRate / jobConfig.maxJobs) * 100;

    byJobType[jobName] = {
      currentRate,
      maxRate: jobConfig.maxJobs,
      windowSeconds: jobConfig.windowSeconds,
      rejectedCount: state.rejectedCount,
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    };

    totalRejected += state.rejectedCount;
  }

  return {
    byJobType,
    totalRejected,
  };
}

/**
 * Reset rate limit state (for testing).
 */
export function resetRateLimitState(): void {
  for (const state of rateLimitState.values()) {
    state.timestamps = [];
    state.rejectedCount = 0;
  }
}

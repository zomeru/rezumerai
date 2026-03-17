/**
 * Dynamic job prioritization.
 *
 * Automatically adjusts job priorities based on queue depth
 * to prevent backlog buildup.
 */

import { createLogger } from "@/lib/logger";
import { type JobName, JobPriority } from "./queue";

const logger = createLogger({ module: "priority" });

export interface PriorityConfig {
  /** Base priority (lower = higher priority) */
  basePriority: number;
  /** Priority boost when queue depth exceeds threshold */
  depthThreshold: number;
  /** Priority boost amount when threshold exceeded */
  depthBoost: number;
  /** Maximum priority boost */
  maxBoost: number;
}

const DEFAULT_CONFIG: Record<JobName, PriorityConfig> = {
  "generate-embeddings": {
    basePriority: JobPriority.NORMAL,
    depthThreshold: 50,
    depthBoost: 2,
    maxBoost: 5,
  },
  "reindex-conversation": {
    basePriority: JobPriority.LOW,
    depthThreshold: 20,
    depthBoost: 3,
    maxBoost: 6,
  },
  "record-analytics": {
    basePriority: JobPriority.LOW,
    depthThreshold: 200,
    depthBoost: 1,
    maxBoost: 3,
  },
  "record-audit-log": {
    basePriority: JobPriority.HIGH,
    depthThreshold: 100,
    depthBoost: 1,
    maxBoost: 2,
  },
  "error-log-retention-cleanup": {
    basePriority: JobPriority.LOW,
    depthThreshold: 5,
    depthBoost: 2,
    maxBoost: 4,
  },
  "ai-persistence-sideeffect": {
    basePriority: JobPriority.NORMAL,
    depthThreshold: 30,
    depthBoost: 2,
    maxBoost: 4,
  },
};

const config: Map<JobName, PriorityConfig> = new Map(
  Object.entries(DEFAULT_CONFIG) as Array<[JobName, PriorityConfig]>,
);

/**
 * Configure priority settings for a job type.
 */
export function configurePriority(jobName: JobName, newConfig: Partial<PriorityConfig>): void {
  const current = config.get(jobName);
  if (current) {
    config.set(jobName, { ...current, ...newConfig });
    logger.info({ jobName, config: config.get(jobName) }, "Priority configuration updated");
  }
}

/**
 * Get priority configuration for a job type.
 */
export function getPriorityConfig(jobName: JobName): PriorityConfig {
  return config.get(jobName) ?? DEFAULT_CONFIG[jobName];
}

/**
 * Get all priority configurations.
 */
export function getAllPriorityConfigs(): Record<JobName, PriorityConfig> {
  const result: Record<JobName, PriorityConfig> = {} as Record<JobName, PriorityConfig>;
  for (const [jobName, jobConfig] of config.entries()) {
    result[jobName] = { ...jobConfig };
  }
  return result;
}

/**
 * Calculate dynamic priority based on queue depth.
 */
export function calculatePriority(jobName: JobName, queueDepth: number): number {
  const jobConfig = config.get(jobName);

  if (!jobConfig) {
    return JobPriority.NORMAL;
  }

  let priority = jobConfig.basePriority;

  // Apply depth-based boost
  if (queueDepth > jobConfig.depthThreshold) {
    const excessDepth = queueDepth - jobConfig.depthThreshold;
    const boostMultiplier = Math.ceil(excessDepth / jobConfig.depthThreshold);
    const boost = Math.min(boostMultiplier * jobConfig.depthBoost, jobConfig.maxBoost);
    priority = Math.max(0, priority - boost); // Lower number = higher priority
  }

  return priority;
}

/**
 * Get recommended priorities based on current queue depths.
 */
export function getRecommendedPriorities(queueDepths: Record<JobName, number>): Record<
  JobName,
  {
    basePriority: number;
    currentPriority: number;
    boost: number;
    reason: string;
  }
> {
  const result: Record<
    JobName,
    {
      basePriority: number;
      currentPriority: number;
      boost: number;
      reason: string;
    }
  > = Object.create(null);

  for (const jobName of Object.keys(DEFAULT_CONFIG) as JobName[]) {
    const jobConfig = config.get(jobName);
    if (!jobConfig) continue;

    const depth = queueDepths[jobName] ?? 0;
    const basePriority = jobConfig.basePriority;
    const currentPriority = calculatePriority(jobName, depth);
    const boost = basePriority - currentPriority;

    let reason = "Normal operation";
    if (boost > 0) {
      reason = `Queue depth (${depth}) exceeds threshold (${jobConfig.depthThreshold})`;
    }

    result[jobName] = {
      basePriority,
      currentPriority,
      boost,
      reason,
    };
  }

  return result;
}

/**
 * Get priority statistics.
 */
export function getPriorityStats(queueDepths: Record<JobName, number>): {
  byJobType: Record<
    JobName,
    {
      basePriority: number;
      currentPriority: number;
      queueDepth: number;
      threshold: number;
      isBoosted: boolean;
      boostAmount: number;
    }
  >;
  totalBoostedQueues: number;
} {
  const byJobType: Record<
    JobName,
    {
      basePriority: number;
      currentPriority: number;
      queueDepth: number;
      threshold: number;
      isBoosted: boolean;
      boostAmount: number;
    }
  > = Object.create(null);

  let totalBoostedQueues = 0;

  for (const jobName of Object.keys(DEFAULT_CONFIG) as JobName[]) {
    const jobConfig = config.get(jobName);
    if (!jobConfig) continue;

    const depth = queueDepths[jobName] ?? 0;
    const basePriority = jobConfig.basePriority;
    const currentPriority = calculatePriority(jobName, depth);
    const boostAmount = basePriority - currentPriority;
    const isBoosted = boostAmount > 0;

    if (isBoosted) {
      totalBoostedQueues++;
    }

    byJobType[jobName] = {
      basePriority,
      currentPriority,
      queueDepth: depth,
      threshold: jobConfig.depthThreshold,
      isBoosted,
      boostAmount,
    };
  }

  return {
    byJobType,
    totalBoostedQueues,
  };
}

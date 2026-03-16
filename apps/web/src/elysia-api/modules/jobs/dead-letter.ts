/**
 * Dead-letter queue handling for failed jobs.
 *
 * When a job fails after all retries, it's moved to a dead-letter queue
 * for manual inspection and potential retry.
 */

import { prisma } from "@rezumerai/database";
import type { JobName } from "./queue";

export interface DeadLetterJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  failedAt: Date;
  retryCount: number;
  errorMessage: string | null;
  errorStack: string | null;
}

/**
 * Get all dead-letter jobs.
 */
export async function getDeadLetterJobs(options?: {
  limit?: number;
  offset?: number;
  jobName?: JobName;
}): Promise<{ jobs: DeadLetterJob[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const where: Record<string, unknown> = {
    state: "failed",
  };

  if (options?.jobName) {
    where.name = options.jobName;
  }

  const whereClause = options?.jobName ? "WHERE state = 'failed' AND name = $1" : "WHERE state = 'failed'";

  const values = options?.jobName ? [options.jobName] : [];

  const [jobsResult, totalResult] = await Promise.all([
    prisma.$queryRawUnsafe<DeadLetterJob[]>(
      `
      SELECT
        id,
        name,
        data,
        completed_on as "failedAt",
        retry_count as "retryCount",
        output as "errorMessage",
        NULL as "errorStack"
      FROM pgboss.job
      ${whereClause}
      ORDER BY completed_on DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
      ...values,
      limit,
      offset,
    ),
    prisma.$queryRawUnsafe<{ total: number }[]>(
      `
      SELECT COUNT(*)::int as total
      FROM pgboss.job
      ${whereClause}
      `,
      ...values,
    ),
  ]);

  return {
    jobs: jobsResult,
    total: totalResult[0]?.total ?? 0,
  };
}

/**
 * Get a specific dead-letter job by ID.
 */
export async function getDeadLetterJob(jobId: string): Promise<DeadLetterJob | null> {
  const jobs = await prisma.$queryRawUnsafe<DeadLetterJob[]>(
    `
    SELECT
      id,
      name,
      data,
      completed_on as "failedAt",
      retry_count as "retryCount",
      output as "errorMessage",
      NULL as "errorStack"
    FROM pgboss.job
    WHERE id = $1 AND state = 'failed'
    `,
    jobId,
  );

  return jobs[0] ?? null;
}

/**
 * Retry a dead-letter job.
 * This creates a new job with the same data.
 */
export async function retryDeadLetterJob(jobId: string): Promise<string | null> {
  const job = await getDeadLetterJob(jobId);

  if (!job) {
    return null;
  }

  // Import here to avoid circular dependency
  const { publishJob } = await import("./queue");

  const newJobId = await publishJob(job.name as JobName, job.data as Record<string, unknown>, {
    retryLimit: 5,
    retryDelay: 1,
    retryBackoff: true,
  });

  return newJobId;
}

/**
 * Delete a dead-letter job.
 */
export async function deleteDeadLetterJob(jobId: string): Promise<boolean> {
  const result = await prisma.$executeRawUnsafe(`DELETE FROM pgboss.job WHERE id = $1 AND state = 'failed'`, jobId);

  return result > 0;
}

/**
 * Retry all dead-letter jobs for a specific queue.
 */
export async function retryAllDeadLetterJobs(jobName?: JobName): Promise<{ retried: number; failed: number }> {
  const { jobs } = await getDeadLetterJobs({ jobName, limit: 1000 });

  let retried = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const newJobId = await retryDeadLetterJob(job.id);
      if (newJobId) {
        retried++;
        // Delete the old job after successful retry
        await deleteDeadLetterJob(job.id);
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { retried, failed };
}

/**
 * Clean up old dead-letter jobs.
 */
export async function cleanupDeadLetterJobs(olderThanDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM pgboss.job WHERE state = 'failed' AND completed_on < $1`,
    cutoffDate,
  );

  return result;
}

/**
 * Get dead-letter queue statistics.
 */
export async function getDeadLetterStats(): Promise<{
  total: number;
  byQueue: Record<string, number>;
  oldestFailedAt: Date | null;
  newestFailedAt: Date | null;
}> {
  const results = await prisma.$queryRawUnsafe<
    Array<{
      name: string;
      count: number;
      oldest: Date;
      newest: Date;
    }>
  >(`
    SELECT
      name,
      COUNT(*)::int as count,
      MIN(completed_on) as oldest,
      MAX(completed_on) as newest
    FROM pgboss.job
    WHERE state = 'failed'
    GROUP BY name
  `);

  const byQueue: Record<string, number> = {};
  let total = 0;
  let oldestFailedAt: Date | null = null;
  let newestFailedAt: Date | null = null;

  for (const row of results) {
    byQueue[row.name] = row.count;
    total += row.count;

    if (row.oldest && (!oldestFailedAt || row.oldest < oldestFailedAt)) {
      oldestFailedAt = row.oldest;
    }

    if (row.newest && (!newestFailedAt || row.newest > newestFailedAt)) {
      newestFailedAt = row.newest;
    }
  }

  return {
    total,
    byQueue,
    oldestFailedAt,
    newestFailedAt,
  };
}

/**
 * Worker registration - wires up job handlers to the queue.
 *
 * This module is imported by the worker process to register all job handlers.
 */

import {
  handleErrorLogRetentionCleanup,
  handleGenerateEmbeddings,
  handleRecordAnalytics,
  handleRecordAuditLog,
  handleReindexConversation,
} from "./handlers";
import { JobName, registerWorker } from "./queue";
import type {
  ErrorLogRetentionCleanupJobData,
  GenerateEmbeddingsJobData,
  RecordAnalyticsJobData,
  RecordAuditLogJobData,
  ReindexConversationJobData,
} from "./types";

/**
 * Register all job workers.
 * Call this once when starting a worker process.
 */
export async function registerAllWorkers(): Promise<void> {
  console.log("[WORKER] Registering all job workers...");

  // Embedding generation jobs (long-running, need more timeout)
  await registerWorker(
    JobName.GENERATE_EMBEDDINGS,
    async (job) => handleGenerateEmbeddings(job.data as unknown as GenerateEmbeddingsJobData),
    {
      batchSize: 5, // Process multiple embedding jobs in parallel
      includeMetadata: true,
    },
  );

  await registerWorker(
    JobName.REINDEX_CONVERSATION,
    async (job) => handleReindexConversation(job.data as unknown as ReindexConversationJobData),
    {
      batchSize: 1, // One at a time - resource intensive
      includeMetadata: true,
    },
  );

  // Observability jobs (high volume, can batch)
  await registerWorker(
    JobName.RECORD_ANALYTICS,
    async (job) => handleRecordAnalytics(job.data as unknown as RecordAnalyticsJobData),
    {
      batchSize: 20, // Batch analytics for efficiency
      includeMetadata: true,
    },
  );

  await registerWorker(
    JobName.RECORD_AUDIT_LOG,
    async (job) => handleRecordAuditLog(job.data as unknown as RecordAuditLogJobData),
    {
      batchSize: 10, // Batch audit logs but smaller than analytics
      includeMetadata: true,
    },
  );

  // Maintenance jobs (single instance, scheduled)
  await registerWorker(
    JobName.ERROR_LOG_RETENTION_CLEANUP,
    async (job) => handleErrorLogRetentionCleanup(job.data as unknown as ErrorLogRetentionCleanupJobData),
    {
      batchSize: 1,
      includeMetadata: true,
    },
  );

  console.log("[WORKER] All job workers registered");
}

/**
 * Register only specific workers.
 * Use this for specialized worker processes.
 */
export async function registerWorkers(jobNames: Array<JobName>): Promise<void> {
  console.log(`[WORKER] Registering workers for: ${jobNames.join(", ")}`);

  for (const jobName of jobNames) {
    switch (jobName) {
      case JobName.GENERATE_EMBEDDINGS:
        await registerWorker(
          jobName,
          async (job) => handleGenerateEmbeddings(job.data as unknown as GenerateEmbeddingsJobData),
          { batchSize: 5 },
        );
        break;

      case JobName.REINDEX_CONVERSATION:
        await registerWorker(
          jobName,
          async (job) => handleReindexConversation(job.data as unknown as ReindexConversationJobData),
          { batchSize: 1 },
        );
        break;

      case JobName.RECORD_ANALYTICS:
        await registerWorker(
          jobName,
          async (job) => handleRecordAnalytics(job.data as unknown as RecordAnalyticsJobData),
          { batchSize: 20 },
        );
        break;

      case JobName.RECORD_AUDIT_LOG:
        await registerWorker(
          jobName,
          async (job) => handleRecordAuditLog(job.data as unknown as RecordAuditLogJobData),
          { batchSize: 10 },
        );
        break;

      case JobName.ERROR_LOG_RETENTION_CLEANUP:
        await registerWorker(
          jobName,
          async (job) => handleErrorLogRetentionCleanup(job.data as unknown as ErrorLogRetentionCleanupJobData),
          { batchSize: 1 },
        );
        break;

      default:
        console.warn(`[WORKER] Unknown job name: ${jobName}`);
    }
  }

  console.log(`[WORKER] Registered ${jobNames.length} worker(s)`);
}

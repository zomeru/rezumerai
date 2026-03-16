/**
 * Job producer helpers - convenient functions for publishing jobs.
 *
 * These are used by application code to enqueue background work.
 * Each function handles the job data construction and validation.
 */

import type { AiConfiguration } from "@rezumerai/types";
import { getRequestContext } from "@/elysia-api/observability/request-context";
import { isJobQueueInitialized, JobName, JobPriority, publishJob, scheduleJob } from "./queue";
import type {
  ErrorLogRetentionCleanupJobData,
  GenerateEmbeddingsJobData,
  RecordAnalyticsJobData,
  RecordAuditLogJobData,
  ReindexConversationJobData,
} from "./types";

// ============================================================================
// Embedding Jobs
// ============================================================================

/**
 * Queue embedding generation for conversation messages.
 *
 * @param conversationId - Conversation ID
 * @param messageIds - Message IDs to embed
 * @param config - AI configuration
 * @returns Job ID or null if queue not initialized
 */
export async function queueGenerateEmbeddings(
  conversationId: string,
  messageIds: string[],
  config: AiConfiguration,
): Promise<string | null> {
  if (messageIds.length === 0) {
    return null;
  }

  const context = getRequestContext();

  const scope = (context?.metadata.scope as "PUBLIC" | "USER" | "ADMIN") ?? "USER";

  const jobData: GenerateEmbeddingsJobData = {
    conversationId,
    userId: context?.userId ?? "system",
    scope,
    messageIds,
    config,
  };

  return publishJob(JobName.GENERATE_EMBEDDINGS, jobData as unknown as Record<string, unknown>, {
    priority: JobPriority.NORMAL,
    timeoutSeconds: 300, // 5 minutes for embedding generation
  });
}

/**
 * Queue conversation reindexing.
 *
 * @param conversationId - Conversation ID
 * @param config - AI configuration
 * @returns Job ID or null if queue not initialized
 */
export async function queueReindexConversation(
  conversationId: string,
  config: AiConfiguration,
): Promise<string | null> {
  const context = getRequestContext();

  const scope = (context?.metadata.scope as "PUBLIC" | "USER" | "ADMIN") ?? "USER";

  const jobData: ReindexConversationJobData = {
    conversationId,
    userId: context?.userId ?? "system",
    scope,
    config,
  };

  return publishJob(JobName.REINDEX_CONVERSATION, jobData as unknown as Record<string, unknown>, {
    priority: JobPriority.LOW,
    timeoutSeconds: 600, // 10 minutes for full reindex
  });
}

// ============================================================================
// Observability Jobs
// ============================================================================

/**
 * Queue analytics event recording.
 *
 * @param input - Analytics event data
 * @returns Job ID or null if queue not initialized
 */
export async function queueRecordAnalytics(
  input: Omit<RecordAnalyticsJobData, "requestContext">,
): Promise<string | null> {
  const context = getRequestContext();

  const jobData: RecordAnalyticsJobData = {
    source: input.source as "API_REQUEST" | "BACKGROUND_JOB",
    eventType: String(input.eventType),
    endpoint: input.endpoint ? String(input.endpoint) : null,
    method: input.method ? String(input.method) : null,
    statusCode: input.statusCode !== undefined && input.statusCode !== null ? Number(input.statusCode) : null,
    durationMs: Number(input.durationMs),
    errorCode: input.errorCode ? String(input.errorCode) : null,
    errorName: input.errorName ? String(input.errorName) : null,
    metadata: input.metadata as Record<string, unknown> | undefined,
    requestContext: context
      ? {
          requestId: context.requestId ?? null,
          source: context.source ?? null,
          userId: context.userId ?? null,
          userRole: context.userRole ?? null,
          metadata: context.metadata as Record<string, unknown>,
        }
      : undefined,
  };

  return publishJob(JobName.RECORD_ANALYTICS, jobData as unknown as Record<string, unknown>, {
    priority: JobPriority.LOW,
    retryLimit: 3, // Fewer retries for analytics (less critical)
  });
}

/**
 * Queue audit log recording.
 *
 * @param input - Audit log data
 * @returns Job ID or null if queue not initialized
 */
export async function queueRecordAuditLog(
  input: Omit<RecordAuditLogJobData, "requestMetadata">,
): Promise<string | null> {
  const context = getRequestContext();

  const jobData: RecordAuditLogJobData = {
    category: input.category as "USER_ACTION" | "SYSTEM_ACTIVITY" | "DATABASE_CHANGE",
    eventType: String(input.eventType),
    action: String(input.action),
    resourceType: String(input.resourceType),
    resourceId: input.resourceId ? String(input.resourceId) : null,
    userId: input.userId ? String(input.userId) : null,
    endpoint: input.endpoint ? String(input.endpoint) : null,
    method: input.method ? String(input.method) : null,
    serviceName: input.serviceName ? String(input.serviceName) : null,
    beforeValues: input.beforeValues as Record<string, unknown> | undefined,
    afterValues: input.afterValues as Record<string, unknown> | undefined,
    requestMetadata: context
      ? {
          requestId: context.requestId ?? null,
          source: context.source ?? null,
          metadata: context.metadata,
        }
      : undefined,
  };

  return publishJob(JobName.RECORD_AUDIT_LOG, jobData as unknown as Record<string, unknown>, {
    priority: JobPriority.HIGH, // Audit logs are important
    retryLimit: 5,
  });
}

// ============================================================================
// Maintenance Jobs
// ============================================================================

/**
 * Queue error log retention cleanup.
 *
 * @param retentionDays - Number of days to retain logs
 * @param triggerSource - What triggered this cleanup
 * @returns Job ID or null if queue not initialized
 */
export async function queueErrorLogRetentionCleanup(
  retentionDays: number,
  triggerSource: "SCHEDULED" | "MANUAL" = "SCHEDULED",
): Promise<string | null> {
  const jobData: ErrorLogRetentionCleanupJobData = {
    retentionDays,
    triggerSource,
  };

  return publishJob(JobName.ERROR_LOG_RETENTION_CLEANUP, jobData as unknown as Record<string, unknown>, {
    priority: JobPriority.LOW,
    timeoutSeconds: 300,
  });
}

/**
 * Schedule error log retention cleanup.
 *
 * @param retentionDays - Number of days to retain logs
 * @param runAt - When to run the cleanup
 * @returns Job ID or null if queue not initialized
 */
export async function scheduleErrorLogRetentionCleanup(
  retentionDays: number,
  runAt: Date | string,
): Promise<string | null> {
  const jobData: ErrorLogRetentionCleanupJobData = {
    retentionDays,
    triggerSource: "SCHEDULED",
  };

  return scheduleJob(JobName.ERROR_LOG_RETENTION_CLEANUP, jobData as unknown as Record<string, unknown>, runAt, {
    priority: JobPriority.LOW,
    timeoutSeconds: 300,
  });
}

// ============================================================================
// Fallback Functions (when queue is unavailable)
// ============================================================================

/**
 * Check if job queue is available.
 * Used for graceful degradation.
 */
export function isJobQueueAvailable(): boolean {
  return isJobQueueInitialized();
}

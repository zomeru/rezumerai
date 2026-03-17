/**
 * Job handlers - the actual work performed by background workers.
 *
 * Each handler:
 * - Is idempotent where possible
 * - Has proper error handling
 * - Logs structured output
 * - Returns JobResult for tracking
 */

import { prisma } from "@rezumerai/database";
import { buildMessageChunks } from "@/elysia-api/modules/ai/memory/chunking";
import { embedAssistantTexts } from "@/elysia-api/modules/ai/memory/embedder";
import { ConversationMemoryRepository } from "@/elysia-api/modules/ai/memory/repository";
import { toPrismaJsonValue } from "@/elysia-api/observability/redaction";
import { logger } from "@/lib/logger";
import type {
  ErrorLogRetentionCleanupJobData,
  GenerateEmbeddingsJobData,
  JobResult,
  RecordAnalyticsJobData,
  RecordAuditLogJobData,
  ReindexConversationJobData,
} from "./types";

// ============================================================================
// Embedding Generation Handler
// ============================================================================

/**
 * Generate embeddings for conversation messages.
 *
 * This job is idempotent - running it multiple times with the same
 * messageIds will upsert the same embeddings.
 */
export async function handleGenerateEmbeddings(jobData: GenerateEmbeddingsJobData): Promise<JobResult> {
  const startTime = Date.now();
  const { conversationId, messageIds, config } = jobData;

  try {
    // Fetch messages to embed - get userId and scope from the message itself
    // This ensures we use the correct userId that exists in the database
    const messages = await prisma.aiAssistantConversationMessage.findMany({
      where: {
        id: { in: messageIds },
        conversationId,
      },
      orderBy: { createdAt: "asc" },
      include: {
        conversation: {
          select: {
            userId: true,
            scope: true,
          },
        },
      },
    });

    if (messages.length === 0) {
      return {
        success: true,
        processedCount: 0,
        durationMs: Date.now() - startTime,
        metadata: { reason: "No messages found" },
      };
    }

    // Get userId and scope from the first message's conversation
    // This ensures we use valid database values
    const conversationUserId = messages[0]?.conversation?.userId;
    const conversationScope = messages[0]?.conversation?.scope;

    if (!conversationUserId) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorMessage: "Conversation not found or has no userId",
        metadata: {
          conversationId,
          messageIds,
        },
      };
    }

    logger.debug(
      {
        conversationId,
        conversationUserId,
        messageCount: messages.length,
      },
      "Processing embedding generation",
    );

    // Prepare content for embedding
    const contents = messages.map((m) => m.content);

    // Generate embeddings
    const { embeddings } = await embedAssistantTexts(config, contents);

    if (embeddings.length === 0) {
      return {
        success: true,
        processedCount: 0,
        durationMs: Date.now() - startTime,
        metadata: { reason: "No embeddings generated" },
      };
    }

    // Build chunks for each message - use userId and scope from conversation
    const chunks = buildMessageChunks(
      messages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        userId: conversationUserId, // Use from conversation, not job data
        scope: conversationScope as "PUBLIC" | "USER" | "ADMIN", // Use from conversation
        role: message.role as "user" | "assistant",
        content: message.content,
        createdAt: message.createdAt,
      })),
    );

    // Upsert embeddings
    await ConversationMemoryRepository.upsertEmbeddings(prisma, {
      chunks,
      embeddings,
    });

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        conversationId,
        embeddingCount: embeddings.length,
        messageCount: messages.length,
        durationMs,
      },
      "Generated embeddings for conversation",
    );

    return {
      success: true,
      processedCount: embeddings.length,
      durationMs,
      metadata: {
        conversationId,
        messageCount: messages.length,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      {
        conversationId,
        err: error,
        errorMessage,
      },
      "Failed to generate embeddings",
    );

    return {
      success: false,
      durationMs,
      errorMessage,
      metadata: {
        conversationId,
        messageIds,
      },
    };
  }
}

/**
 * Reindex an entire conversation's embeddings.
 *
 * Used when embedding strategy changes or for maintenance.
 */
export async function handleReindexConversation(jobData: ReindexConversationJobData): Promise<JobResult> {
  const startTime = Date.now();
  const { conversationId, config } = jobData;

  try {
    // Fetch all messages in the conversation with conversation data
    const messages = await prisma.aiAssistantConversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        conversation: {
          select: {
            userId: true,
            scope: true,
          },
        },
      },
    });

    if (messages.length === 0) {
      return {
        success: true,
        processedCount: 0,
        durationMs: Date.now() - startTime,
        metadata: { reason: "No messages found" },
      };
    }

    // Get userId and scope from the first message's conversation
    const conversationUserId = messages[0]?.conversation?.userId;
    const conversationScope = messages[0]?.conversation?.scope;

    if (!conversationUserId) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorMessage: "Conversation not found or has no userId",
        metadata: {
          conversationId,
        },
      };
    }

    // Build chunks - use userId and scope from conversation
    const chunks = buildMessageChunks(
      messages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        userId: conversationUserId, // Use from conversation, not job data
        scope: conversationScope as "PUBLIC" | "USER" | "ADMIN", // Use from conversation
        role: message.role as "user" | "assistant",
        content: message.content,
        createdAt: message.createdAt,
      })),
    );

    // Generate embeddings for all chunks
    const { embeddings } = await embedAssistantTexts(
      config,
      chunks.map((c) => c.content),
    );

    // Upsert embeddings (this will replace existing ones)
    await ConversationMemoryRepository.upsertEmbeddings(prisma, {
      chunks,
      embeddings,
    });

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        conversationId,
        embeddingCount: embeddings.length,
        messageCount: messages.length,
        durationMs,
      },
      "Reindexed conversation embeddings",
    );

    return {
      success: true,
      processedCount: embeddings.length,
      durationMs,
      metadata: {
        conversationId,
        messageCount: messages.length,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      {
        conversationId,
        err: error,
        errorMessage,
      },
      "Failed to reindex conversation",
    );

    return {
      success: false,
      durationMs,
      errorMessage,
      metadata: {
        conversationId,
      },
    };
  }
}

// ============================================================================
// Analytics Recording Handler
// ============================================================================

/**
 * Record an analytics event to the database.
 *
 * This replaces the inline analytics recording that could fail silently.
 */
export async function handleRecordAnalytics(jobData: RecordAnalyticsJobData): Promise<JobResult> {
  const startTime = Date.now();
  const {
    source,
    eventType,
    endpoint,
    method,
    statusCode,
    durationMs: jobDurationMs,
    errorCode,
    errorName,
    metadata,
    requestContext,
  } = jobData;

  try {
    const ctxEndpoint = requestContext?.metadata?.endpoint as string | null | undefined;
    const ctxMethod = requestContext?.metadata?.method as string | null | undefined;

    await prisma.analyticsEvent.create({
      data: {
        source,
        eventType,
        endpoint: endpoint ?? ctxEndpoint ?? null,
        method: method ?? ctxMethod ?? null,
        statusCode: statusCode ?? null,
        durationMs: jobDurationMs,
        userId: requestContext?.userId ?? null,
        isAdmin: requestContext?.userRole === "ADMIN",
        errorCode: errorCode ?? null,
        errorName: errorName ?? null,
        metadata:
          toPrismaJsonValue({
            requestId: requestContext?.requestId ?? null,
            source: requestContext?.source ?? null,
            metadata: {
              ...((requestContext?.metadata as Record<string, unknown>) ?? {}),
              ...(metadata ?? {}),
            },
          }) ?? undefined,
      },
    });

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      processedCount: 1,
      durationMs,
      metadata: {
        eventType,
        source,
      },
    };
  } catch (error) {
    logger.error({ err: error, eventType }, "Failed to record analytics event");

    // Re-throw to trigger retry - analytics are important
    throw error;
  }
}

// ============================================================================
// Audit Log Recording Handler
// ============================================================================

/**
 * Record an audit log entry to the database.
 *
 * This replaces the inline audit logging that could fail silently.
 * Audit logs are critical for compliance, so we retry on failure.
 */
export async function handleRecordAuditLog(jobData: RecordAuditLogJobData): Promise<JobResult> {
  const startTime = Date.now();
  const {
    category,
    eventType,
    action,
    resourceType,
    resourceId,
    userId,
    endpoint,
    method,
    serviceName,
    requestMetadata,
    beforeValues,
    afterValues,
  } = jobData;

  try {
    await prisma.auditLog.create({
      data: {
        category,
        eventType,
        action,
        resourceType,
        resourceId: resourceId ?? null,
        userId: userId ?? null,
        endpoint: endpoint ?? null,
        method: method ?? null,
        serviceName: serviceName ?? null,
        requestMetadata: toPrismaJsonValue(requestMetadata) ?? undefined,
        beforeValues: toPrismaJsonValue(beforeValues) ?? undefined,
        afterValues: toPrismaJsonValue(afterValues) ?? undefined,
      },
    });

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      processedCount: 1,
      durationMs,
      metadata: {
        eventType,
        category,
        resourceType,
      },
    };
  } catch (error) {
    logger.error({ err: error, eventType }, "Failed to record audit log");

    // Re-throw to trigger retry - audit logs are critical for compliance
    throw error;
  }
}

// ============================================================================
// Error Log Retention Cleanup Handler
// ============================================================================

/**
 * Clean up expired error logs based on retention policy.
 *
 * This replaces the inline cron job with proper retry handling.
 */
export async function handleErrorLogRetentionCleanup(jobData: ErrorLogRetentionCleanupJobData): Promise<JobResult> {
  const startTime = Date.now();
  const { retentionDays, triggerSource } = jobData;

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete expired error logs
    const result = await prisma.errorLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const deletedCount = result.count;
    const durationMs = Date.now() - startTime;

    logger.info({ deletedCount, retentionDays, durationMs, triggerSource }, "Error log retention cleanup completed");

    return {
      success: true,
      processedCount: deletedCount,
      durationMs,
      metadata: {
        deletedCount,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        triggerSource,
      },
    };
  } catch (error) {
    logger.error({ err: error, retentionDays, triggerSource }, "Error log retention cleanup failed");

    // Re-throw to trigger retry
    throw error;
  }
}

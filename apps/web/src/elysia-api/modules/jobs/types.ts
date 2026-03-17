/**
 * Job type definitions and payload schemas.
 *
 * All job payloads are validated using Zod schemas from @rezumerai/types.
 * This ensures type safety between job producers and consumers.
 */

import type { AiConfiguration } from "@rezumerai/types";
import type { JobName } from "./queue";

// ============================================================================
// Embedding Generation Jobs
// ============================================================================

/**
 * Generate embeddings for conversation messages.
 * Used when saving assistant conversations.
 */
export interface GenerateEmbeddingsJobData {
  /** Conversation ID */
  conversationId: string;
  /** User ID for ownership */
  userId: string;
  /** Scope (PUBLIC, USER, ADMIN) */
  scope: "PUBLIC" | "USER" | "ADMIN";
  /** Message IDs to embed */
  messageIds: string[];
  /** AI configuration for embedding model selection */
  config: AiConfiguration;
}

/**
 * Reindex an entire conversation's embeddings.
 * Used for maintenance or when embedding strategy changes.
 */
export interface ReindexConversationJobData {
  /** Conversation ID */
  conversationId: string;
  /** User ID for ownership */
  userId: string;
  /** Scope */
  scope: "PUBLIC" | "USER" | "ADMIN";
  /** AI configuration */
  config: AiConfiguration;
}

// ============================================================================
// Observability Jobs
// ============================================================================

/**
 * Record an analytics event.
 * Replaces inline analytics recording.
 */
export interface RecordAnalyticsJobData {
  /** Event source */
  source: "API_REQUEST" | "BACKGROUND_JOB";
  /** Event type name */
  eventType: string;
  /** API endpoint (optional) */
  endpoint?: string | null;
  /** HTTP method (optional) */
  method?: string | null;
  /** HTTP status code (optional) */
  statusCode?: number | null;
  /** Request duration in ms */
  durationMs: number;
  /** Error code if failed (optional) */
  errorCode?: string | null;
  /** Error name if failed (optional) */
  errorName?: string | null;
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>;
  /** Request context (optional) */
  requestContext?: {
    requestId: string | null;
    source: string | null;
    userId: string | null;
    userRole: string | null;
    metadata: Record<string, unknown>;
  };
}

/**
 * Record an audit log entry.
 * Replaces inline audit logging for critical operations.
 */
export interface RecordAuditLogJobData {
  /** Log category */
  category: "USER_ACTION" | "SYSTEM_ACTIVITY" | "DATABASE_CHANGE";
  /** Event type name */
  eventType: string;
  /** Action performed */
  action: string;
  /** Resource type affected */
  resourceType: string;
  /** Resource ID (optional) */
  resourceId?: string | null;
  /** User ID who performed action (optional) */
  userId?: string | null;
  /** API endpoint (optional) */
  endpoint?: string | null;
  /** HTTP method (optional) */
  method?: string | null;
  /** Service name (optional) */
  serviceName?: string | null;
  /** Request metadata (optional) */
  requestMetadata?: Record<string, unknown>;
  /** State before change (optional) */
  beforeValues?: Record<string, unknown>;
  /** State after change (optional) */
  afterValues?: Record<string, unknown>;
}

// ============================================================================
// Maintenance Jobs
// ============================================================================

/**
 * Clean up expired error logs.
 * Scheduled job with proper retry handling.
 */
export interface ErrorLogRetentionCleanupJobData {
  /** Retention period in days */
  retentionDays: number;
  /** Trigger source (SCHEDULED or MANUAL) */
  triggerSource: "SCHEDULED" | "MANUAL";
}

// ============================================================================
// AI Side-Effect Jobs
// ============================================================================

/**
 * Handle AI persistence side effects.
 * Used for non-blocking AI operations that need durability.
 */
export interface AiPersistenceSideEffectJobData {
  /** Operation type */
  operation: "SAVE_CONVERSATION" | "UPDATE_INDEX" | "CACHE_WARMING";
  /** User ID */
  userId: string;
  /** Operation-specific data */
  data: Record<string, unknown>;
  /** AI configuration */
  config?: AiConfiguration;
}

// ============================================================================
// Job Payload Union Type
// ============================================================================

/**
 * Union of all job data types.
 * Used for type-safe job publishing.
 */
export type JobDataMap = {
  "generate-embeddings": GenerateEmbeddingsJobData;
  "reindex-conversation": ReindexConversationJobData;
  "record-analytics": RecordAnalyticsJobData;
  "record-audit-log": RecordAuditLogJobData;
  "error-log-retention-cleanup": ErrorLogRetentionCleanupJobData;
  "ai-persistence-sideeffect": AiPersistenceSideEffectJobData;
};

/**
 * Get the data type for a specific job name.
 */
export type JobData<T extends JobName> = JobDataMap[T];

// ============================================================================
// Job Result Types
// ============================================================================

/**
 * Standard job result structure.
 * All job handlers should return this shape.
 */
export interface JobResult {
  /** Whether job succeeded */
  success: boolean;
  /** Number of items processed */
  processedCount?: number;
  /** Number of items failed */
  failedCount?: number;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for GenerateEmbeddingsJobData.
 */
export function isGenerateEmbeddingsJobData(data: Record<string, unknown>): boolean {
  return (
    typeof data.conversationId === "string" &&
    typeof data.userId === "string" &&
    typeof data.scope === "string" &&
    Array.isArray(data.messageIds) &&
    typeof data.config === "object" &&
    data.config !== null
  );
}

/**
 * Type guard for RecordAnalyticsJobData.
 */
export function isRecordAnalyticsJobData(data: Record<string, unknown>): boolean {
  return typeof data.source === "string" && typeof data.eventType === "string" && typeof data.durationMs === "number";
}

/**
 * Type guard for RecordAuditLogJobData.
 */
export function isRecordAuditLogJobData(data: Record<string, unknown>): boolean {
  return (
    typeof data.category === "string" &&
    typeof data.eventType === "string" &&
    typeof data.action === "string" &&
    typeof data.resourceType === "string"
  );
}

/**
 * Type guard for ErrorLogRetentionCleanupJobData.
 */
export function isErrorLogRetentionCleanupJobData(data: Record<string, unknown>): boolean {
  return typeof data.retentionDays === "number" && typeof data.triggerSource === "string";
}

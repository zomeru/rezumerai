import { FEATURE_FLAG_NAME_PATTERN, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@rezumerai/types";
import type { Static } from "elysia";
import Elysia, { t } from "elysia";

const Pagination = t.Object({
  page: t.Integer({ minimum: 1 }),
  pageSize: t.Integer({ minimum: 1 }),
  totalCount: t.Integer({ minimum: 0 }),
  totalPages: t.Integer({ minimum: 0 }),
});
const IsoDateTimeString = t.String();

const UserRole = t.Union([t.Literal("ADMIN"), t.Literal("USER")]);
const AdminUserStatus = t.Literal("ACTIVE");
const ReadByUser = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
});

const ErrorLogListQuery = t.Object({
  page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  pageSize: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  isRead: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
});

const UserListQuery = t.Object({
  page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  pageSize: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  search: t.Optional(t.String()),
  role: t.Optional(UserRole),
});

const AuditLogListQuery = t.Object({
  page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  pageSize: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  search: t.Optional(t.String()),
  category: t.Optional(t.Union([t.Literal("USER_ACTION"), t.Literal("SYSTEM_ACTIVITY"), t.Literal("DATABASE_CHANGE")])),
});

const AnalyticsQuery = t.Object({
  timeframeDays: t.Optional(t.String({ pattern: "^[0-9]+$" })),
});

const ParamById = t.Object({
  id: t.String({ minLength: 1 }),
});

const ParamByName = t.Object({
  name: t.String({ minLength: 1 }),
});

const FeatureFlagName = t.String({ minLength: 1, maxLength: 64, pattern: FEATURE_FLAG_NAME_PATTERN });
const FeatureFlagParamByName = t.Object({
  name: FeatureFlagName,
});

const ErrorLogListItem = t.Object({
  id: t.String(),
  errorName: t.String(),
  createdAt: IsoDateTimeString,
  endpoint: t.String(),
  method: t.String(),
  functionName: t.Nullable(t.String()),
  isRead: t.Boolean(),
});

const ErrorLogDetail = t.Object({
  id: t.String(),
  errorName: t.String(),
  message: t.String(),
  stackTraceJson: t.String(),
  endpoint: t.String(),
  method: t.String(),
  functionName: t.Nullable(t.String()),
  queryParams: t.Nullable(t.Any()),
  requestBody: t.Nullable(t.Any()),
  headers: t.Nullable(t.Any()),
  userId: t.Nullable(t.String()),
  environment: t.Union([t.Literal("development"), t.Literal("production")]),
  createdAt: IsoDateTimeString,
  isRead: t.Boolean(),
  readAt: t.Nullable(IsoDateTimeString),
  readByUserId: t.Nullable(t.String()),
  readByUser: t.Nullable(ReadByUser),
});

const AdminUserCredits = t.Object({
  remaining: t.Integer({ minimum: 0 }),
  dailyLimit: t.Integer({ minimum: 1 }),
});

const AdminUserListItem = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: "email" }),
  role: UserRole,
  resumeCount: t.Integer({ minimum: 0 }),
  credits: AdminUserCredits,
  status: AdminUserStatus,
  createdAt: IsoDateTimeString,
});

const UserActivityItem = t.Object({
  id: t.String(),
  category: t.Union([t.Literal("USER_ACTION"), t.Literal("SYSTEM_ACTIVITY"), t.Literal("DATABASE_CHANGE")]),
  eventType: t.String(),
  action: t.String(),
  resourceType: t.String(),
  resourceId: t.Nullable(t.String()),
  endpoint: t.Nullable(t.String()),
  method: t.Nullable(t.String()),
  createdAt: IsoDateTimeString,
});

const AdminUserDetail = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: "email" }),
  image: t.Nullable(t.String()),
  role: UserRole,
  emailVerified: t.Boolean(),
  status: AdminUserStatus,
  createdAt: IsoDateTimeString,
  updatedAt: IsoDateTimeString,
  resumeCount: t.Integer({ minimum: 0 }),
  credits: AdminUserCredits,
  recentActivity: t.Array(UserActivityItem),
  recentAuditLogs: t.Array(UserActivityItem),
});

const AdminUserPasswordUpdateInput = t.Object({
  password: t.String({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH }),
  confirmPassword: t.String({ minLength: 1 }),
});

const SystemConfigurationEntry = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  value: t.Any(),
  createdAt: IsoDateTimeString,
  updatedAt: IsoDateTimeString,
  isEditable: t.Boolean(),
  validationMode: t.Union([t.Literal("KNOWN_SCHEMA"), t.Literal("RAW_JSON")]),
});

const FeatureFlagEntry = t.Object({
  id: t.String(),
  name: FeatureFlagName,
  enabled: t.Boolean(),
  description: t.Nullable(t.String()),
  rolloutPercentage: t.Integer({ minimum: 0, maximum: 100 }),
  createdAt: IsoDateTimeString,
  updatedAt: IsoDateTimeString,
});

const AuditLogActor = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: "email" }),
});

const AuditLogListItem = t.Object({
  id: t.String(),
  category: t.Union([t.Literal("USER_ACTION"), t.Literal("SYSTEM_ACTIVITY"), t.Literal("DATABASE_CHANGE")]),
  eventType: t.String(),
  action: t.String(),
  resourceType: t.String(),
  resourceId: t.Nullable(t.String()),
  endpoint: t.Nullable(t.String()),
  method: t.Nullable(t.String()),
  serviceName: t.Nullable(t.String()),
  actor: t.Nullable(AuditLogActor),
  createdAt: IsoDateTimeString,
});

const AuditLogDetail = t.Object({
  id: t.String(),
  category: t.Union([t.Literal("USER_ACTION"), t.Literal("SYSTEM_ACTIVITY"), t.Literal("DATABASE_CHANGE")]),
  eventType: t.String(),
  action: t.String(),
  resourceType: t.String(),
  resourceId: t.Nullable(t.String()),
  userId: t.Nullable(t.String()),
  endpoint: t.Nullable(t.String()),
  method: t.Nullable(t.String()),
  serviceName: t.Nullable(t.String()),
  requestMetadata: t.Nullable(t.Any()),
  beforeValues: t.Nullable(t.Any()),
  afterValues: t.Nullable(t.Any()),
  createdAt: IsoDateTimeString,
  actor: t.Nullable(AuditLogActor),
});

const AnalyticsSummary = t.Object({
  totalRequests: t.Integer({ minimum: 0 }),
  totalErrors: t.Integer({ minimum: 0 }),
  errorRate: t.Number({ minimum: 0 }),
  activeUsers: t.Integer({ minimum: 0 }),
  averageResponseTimeMs: t.Number({ minimum: 0 }),
  mostUsedEndpoint: t.Nullable(t.String()),
});

const AnalyticsDatabaseSummary = t.Object({
  averageDbQueryCount: t.Number({ minimum: 0 }),
  averageDbQueryDurationMs: t.Number({ minimum: 0 }),
  slowQueryRequestCount: t.Integer({ minimum: 0 }),
  slowQueryRequestRate: t.Number({ minimum: 0 }),
});

const AnalyticsTimeseriesPoint = t.Object({
  bucketStart: IsoDateTimeString,
  label: t.String(),
  requestCount: t.Integer({ minimum: 0 }),
  errorCount: t.Integer({ minimum: 0 }),
  errorRate: t.Number({ minimum: 0 }),
  averageResponseTimeMs: t.Number({ minimum: 0 }),
  activeUsers: t.Integer({ minimum: 0 }),
  averageDbQueryCount: t.Number({ minimum: 0 }),
  averageDbQueryDurationMs: t.Number({ minimum: 0 }),
  slowQueryRequestCount: t.Integer({ minimum: 0 }),
});

const AnalyticsEndpointUsage = t.Object({
  endpoint: t.String(),
  method: t.String(),
  requestCount: t.Integer({ minimum: 0 }),
  errorCount: t.Integer({ minimum: 0 }),
  errorRate: t.Number({ minimum: 0 }),
  averageResponseTimeMs: t.Number({ minimum: 0 }),
  averageDbQueryCount: t.Number({ minimum: 0 }),
  averageDbQueryDurationMs: t.Number({ minimum: 0 }),
  slowQueryRequestCount: t.Integer({ minimum: 0 }),
  slowQueryRequestRate: t.Number({ minimum: 0 }),
});

const AnalyticsBackgroundJob = t.Object({
  name: t.String(),
  runCount: t.Integer({ minimum: 0 }),
  successCount: t.Integer({ minimum: 0 }),
  failureCount: t.Integer({ minimum: 0 }),
  averageDurationMs: t.Number({ minimum: 0 }),
  lastRunAt: t.Nullable(IsoDateTimeString),
});

const AnalyticsSlowQueryPattern = t.Object({
  model: t.String(),
  operation: t.String(),
  occurrenceCount: t.Integer({ minimum: 0 }),
  averageDurationMs: t.Number({ minimum: 0 }),
  maxDurationMs: t.Number({ minimum: 0 }),
});

const AnalyticsDashboard = t.Object({
  timeframeDays: t.Integer({ minimum: 1 }),
  granularity: t.Union([t.Literal("hour"), t.Literal("day")]),
  summary: AnalyticsSummary,
  database: AnalyticsDatabaseSummary,
  requestVolume: t.Array(AnalyticsTimeseriesPoint),
  endpointUsage: t.Array(AnalyticsEndpointUsage),
  slowQueryPatterns: t.Array(AnalyticsSlowQueryPattern),
  backgroundJobs: t.Array(AnalyticsBackgroundJob),
});

export type ErrorLogListQueryInput = Static<typeof ErrorLogListQuery>;
export type UserListQueryInput = Static<typeof UserListQuery>;
export type AuditLogListQueryInput = Static<typeof AuditLogListQuery>;
export type AnalyticsQueryInput = Static<typeof AnalyticsQuery>;

export const AdminModel = new Elysia().model({
  "adminError.QueryList": ErrorLogListQuery,
  "adminError.ParamById": ParamById,
  "adminError.ListResponse": t.Object({
    items: t.Array(ErrorLogListItem),
    pagination: Pagination,
  }),
  "adminError.DetailResponse": ErrorLogDetail,
  "adminError.Error": t.String(),
  "adminUser.QueryList": UserListQuery,
  "adminUser.ParamById": ParamById,
  "adminUser.RoleUpdateInput": t.Object({ role: UserRole }),
  "adminUser.PasswordUpdateInput": AdminUserPasswordUpdateInput,
  "adminUser.ListResponse": t.Object({
    items: t.Array(AdminUserListItem),
    pagination: Pagination,
  }),
  "adminUser.DetailResponse": AdminUserDetail,
  "adminUser.Error": t.String(),
  "adminConfig.ParamByName": ParamByName,
  "adminConfig.UpdateInput": t.Object({
    value: t.Any(),
  }),
  "adminConfig.Entry": SystemConfigurationEntry,
  "adminConfig.ListResponse": t.Object({
    items: t.Array(SystemConfigurationEntry),
  }),
  "adminFeature.ParamByName": FeatureFlagParamByName,
  "adminFeature.SaveInput": t.Object({
    enabled: t.Boolean(),
    description: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
    rolloutPercentage: t.Integer({ minimum: 0, maximum: 100 }),
  }),
  "adminFeature.Entry": FeatureFlagEntry,
  "adminFeature.ListResponse": t.Object({
    items: t.Array(FeatureFlagEntry),
  }),
  "adminAudit.QueryList": AuditLogListQuery,
  "adminAudit.ParamById": ParamById,
  "adminAudit.ListResponse": t.Object({
    items: t.Array(AuditLogListItem),
    pagination: Pagination,
    countsByCategory: t.Object({
      USER_ACTION: t.Integer({ minimum: 0 }),
      SYSTEM_ACTIVITY: t.Integer({ minimum: 0 }),
      DATABASE_CHANGE: t.Integer({ minimum: 0 }),
    }),
  }),
  "adminAudit.DetailResponse": AuditLogDetail,
  "adminAnalytics.Query": AnalyticsQuery,
  "adminAnalytics.Response": AnalyticsDashboard,
  // Queue metrics and dead-letter models
  "adminQueue.MetricsResponse": t.Object({
    initialized: t.Boolean(),
    queues: t.Record(
      t.String(),
      t.Object({
        pending: t.Integer(),
        active: t.Integer(),
        completed: t.Integer(),
        failed: t.Integer(),
        retry: t.Integer(),
        jobsPublished: t.Integer(),
        jobsCompleted: t.Integer(),
        jobsFailed: t.Integer(),
        totalProcessingTimeMs: t.Integer(),
        averageProcessingTimeMs: t.Integer(),
        lastJobPublishedAt: t.Nullable(t.String()),
        lastJobCompletedAt: t.Nullable(t.String()),
        hitRate: t.Nullable(t.Number()),
      }),
    ),
    cache: t.Object({
      size: t.Integer(),
      maxEntries: t.Integer(),
      hitCount: t.Integer(),
      missCount: t.Integer(),
      hitRate: t.Number(),
    }),
    alerts: t.Object({
      totalAlerts: t.Integer(),
      alertsByQueue: t.Record(t.String(), t.Integer()),
      lastAlerts: t.Record(t.String(), t.String()),
    }),
  }),
  "adminQueue.HealthResponse": t.Object({
    health: t.Object({
      status: t.Union([t.Literal("healthy"), t.Literal("degraded")]),
      failureRate: t.Number(),
      queueInitialized: t.Boolean(),
      totalJobsPublished: t.Integer(),
      totalJobsFailed: t.Integer(),
      cacheHitRate: t.Number(),
      timestamp: t.String(),
    }),
    queues: t.Record(
      t.String(),
      t.Object({
        pending: t.Integer(),
        active: t.Integer(),
        completed: t.Integer(),
        failed: t.Integer(),
        retry: t.Integer(),
        jobsPublished: t.Integer(),
        jobsCompleted: t.Integer(),
        jobsFailed: t.Integer(),
        totalProcessingTimeMs: t.Integer(),
        averageProcessingTimeMs: t.Integer(),
        lastJobPublishedAt: t.Nullable(t.String()),
        lastJobCompletedAt: t.Nullable(t.String()),
        hitRate: t.Nullable(t.Number()),
      }),
    ),
    cache: t.Object({
      size: t.Integer(),
      maxEntries: t.Integer(),
      hitCount: t.Integer(),
      missCount: t.Integer(),
      hitRate: t.Number(),
    }),
  }),
  "adminQueue.DeadLetterListResponse": t.Object({
    jobs: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        data: t.Any(),
        failedAt: t.String(),
        retryCount: t.Integer(),
        errorMessage: t.Nullable(t.String()),
        errorStack: t.Nullable(t.String()),
      }),
    ),
    total: t.Integer(),
    stats: t.Object({
      total: t.Integer(),
      byQueue: t.Record(t.String(), t.Integer()),
      oldestFailedAt: t.Nullable(t.String()),
      newestFailedAt: t.Nullable(t.String()),
    }),
  }),
  "adminQueue.DeadLetterDetailResponse": t.Object({
    id: t.String(),
    name: t.String(),
    data: t.Any(),
    failedAt: t.String(),
    retryCount: t.Integer(),
    errorMessage: t.Nullable(t.String()),
    errorStack: t.Nullable(t.String()),
  }),
  "adminQueue.RetryResponse": t.Object({
    success: t.Boolean(),
    newJobId: t.String(),
  }),
  "adminQueue.DeleteResponse": t.Object({
    success: t.Boolean(),
  }),
  "adminQueue.RetryAllResponse": t.Object({
    retried: t.Integer(),
    failed: t.Integer(),
  }),
  "adminQueue.CleanupResponse": t.Object({
    deleted: t.Integer(),
  }),
  "adminQueue.AlertConfigResponse": t.Object({
    config: t.Object({
      warningThreshold: t.Integer(),
      criticalThreshold: t.Integer(),
      cooldownSeconds: t.Integer(),
      enabled: t.Boolean(),
      webhookUrl: t.Optional(t.Nullable(t.String())),
      slackWebhookUrl: t.Optional(t.Nullable(t.String())),
    }),
    stats: t.Object({
      totalAlerts: t.Integer(),
      alertsByQueue: t.Record(t.String(), t.Integer()),
      lastAlerts: t.Record(t.String(), t.String()),
    }),
  }),
  "adminQueue.UpdateConfigResponse": t.Object({
    success: t.Boolean(),
  }),
  "adminQueue.TimeoutConfigResponse": t.Object({
    config: t.Object({
      defaultTimeoutSeconds: t.Integer(),
      longTimeoutSeconds: t.Integer(),
      veryLongTimeoutSeconds: t.Integer(),
      jobTimeouts: t.Record(t.String(), t.Integer()),
    }),
    activeJobs: t.Object({
      totalActive: t.Integer(),
      byJobType: t.Record(t.String(), t.Integer()),
      longestRunning: t.Array(
        t.Object({
          jobId: t.String(),
          jobName: t.String(),
          durationSeconds: t.Integer(),
          timeoutSeconds: t.Integer(),
          percentUsed: t.Number(),
        }),
      ),
      approachingTimeout: t.Array(
        t.Object({
          jobId: t.String(),
          jobName: t.String(),
          durationSeconds: t.Integer(),
          timeoutSeconds: t.Integer(),
          percentUsed: t.Number(),
        }),
      ),
    }),
  }),
  "adminQueue.RateLimitConfigResponse": t.Object({
    configs: t.Record(
      t.String(),
      t.Object({
        maxJobs: t.Integer(),
        windowSeconds: t.Integer(),
        backpressureThreshold: t.Integer(),
      }),
    ),
    stats: t.Object({
      byJobType: t.Record(
        t.String(),
        t.Object({
          currentRate: t.Integer(),
          maxRate: t.Integer(),
          windowSeconds: t.Integer(),
          rejectedCount: t.Integer(),
          utilizationPercent: t.Number(),
        }),
      ),
      totalRejected: t.Integer(),
    }),
  }),
  "adminQueue.BatchStatsResponse": t.Object({
    byJobType: t.Record(
      t.String(),
      t.Object({
        pendingItems: t.Integer(),
        maxBatchSize: t.Integer(),
        flushIntervalMs: t.Integer(),
        hasPendingTimer: t.Boolean(),
        oldestItemAgeMs: t.Nullable(t.Integer()),
      }),
    ),
    totalPending: t.Integer(),
  }),
  "adminQueue.PriorityConfigResponse": t.Object({
    configs: t.Record(
      t.String(),
      t.Object({
        basePriority: t.Integer(),
        depthThreshold: t.Integer(),
        depthBoost: t.Integer(),
        maxBoost: t.Integer(),
      }),
    ),
    stats: t.Object({
      byJobType: t.Record(
        t.String(),
        t.Object({
          basePriority: t.Integer(),
          currentPriority: t.Integer(),
          queueDepth: t.Integer(),
          threshold: t.Integer(),
          isBoosted: t.Boolean(),
          boostAmount: t.Integer(),
        }),
      ),
      totalBoostedQueues: t.Integer(),
    }),
  }),
} as const);

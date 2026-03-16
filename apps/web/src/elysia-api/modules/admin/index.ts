import Elysia, { t } from "elysia";
import { z } from "zod";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import type { JobName } from "../jobs/queue";
import {
  AdminModel,
  type AnalyticsQueryInput,
  type AuditLogListQueryInput,
  type ErrorLogListQueryInput,
  type UserListQueryInput,
} from "./model";
import { AdminService, ErrorLogService } from "./service";

const ADMIN_FORBIDDEN_MESSAGE = "Admin access is required";
const ERROR_LOG_NOT_FOUND_MESSAGE = AdminService.messages.ERROR_LOG_NOT_FOUND_MESSAGE;
const USER_NOT_FOUND_MESSAGE = AdminService.messages.USER_NOT_FOUND_MESSAGE;
const AUDIT_LOG_NOT_FOUND_MESSAGE = AdminService.messages.AUDIT_LOG_NOT_FOUND_MESSAGE;
const CONFIG_NOT_FOUND_MESSAGE = AdminService.messages.CONFIG_NOT_FOUND_MESSAGE;
const LAST_ADMIN_ROLE_CHANGE_MESSAGE = AdminService.messages.LAST_ADMIN_ROLE_CHANGE_MESSAGE;
const PASSWORD_CONFIRMATION_MISMATCH_MESSAGE = "Passwords do not match.";

function parseErrorListQuery(query: ErrorLogListQueryInput): {
  page: number | undefined;
  pageSize: number | undefined;
  isRead: boolean | undefined;
} {
  const page = query.page ? Number(query.page) : undefined;
  const pageSize = query.pageSize ? Number(query.pageSize) : undefined;

  let isRead: boolean | undefined;

  if (query.isRead === "true") {
    isRead = true;
  }

  if (query.isRead === "false") {
    isRead = false;
  }

  return {
    page,
    pageSize,
    isRead,
  };
}

function parseUserListQuery(query: UserListQueryInput) {
  return {
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    search: query.search?.trim() || undefined,
    role: query.role ?? null,
  };
}

function parseAuditListQuery(query: AuditLogListQueryInput) {
  return {
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    search: query.search?.trim() || undefined,
    category: query.category ?? null,
  };
}

function parseAnalyticsQuery(query: AnalyticsQueryInput): number | undefined {
  return query.timeframeDays ? Number(query.timeframeDays) : undefined;
}

export const adminModule = new Elysia({ name: "module/admin", prefix: "/admin" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(AdminModel)
  // Keep the admin policy local to the admin module so it cannot affect sibling routes.
  .derive(async ({ user, set }) => {
    if (typeof user?.id !== "string") {
      set.status = 403;
      return {
        __forbidden: true as const,
      };
    }

    if (user.role !== "ADMIN") {
      set.status = 403;
      return {
        __forbidden: true as const,
      };
    }

    return {
      __forbidden: false as const,
    };
  })
  .onBeforeHandle(({ __forbidden, status }) => {
    if (__forbidden) {
      return status(403, ADMIN_FORBIDDEN_MESSAGE);
    }
  })
  .get(
    "/errors",
    async ({ db, query, status }) => {
      const result = await ErrorLogService.listErrorLogs(db, parseErrorListQuery(query));

      return status(200, result);
    },
    {
      query: "adminError.QueryList",
      response: {
        200: "adminError.ListResponse",
        403: "adminError.Error",
      },
      detail: {
        summary: "List tracked application errors",
        tags: ["Admin", "Errors"],
      },
    },
  )
  .get(
    "/errors/:id",
    async ({ db, params, status }) => {
      const errorLog = await ErrorLogService.getErrorLogById(db, params.id);

      if (!errorLog) {
        return status(404, ERROR_LOG_NOT_FOUND_MESSAGE);
      }

      return status(200, errorLog);
    },
    {
      params: "adminError.ParamById",
      response: {
        200: "adminError.DetailResponse",
        403: "adminError.Error",
        404: "adminError.Error",
      },
      detail: {
        summary: "Get detailed error log entry",
        tags: ["Admin", "Errors"],
      },
    },
  )
  .patch(
    "/errors/:id/read",
    async ({ db, user, params, status }) => {
      const markedAsRead = await ErrorLogService.markAsRead(db, params.id, user.id);

      if (!markedAsRead) {
        return status(404, ERROR_LOG_NOT_FOUND_MESSAGE);
      }

      return status(200, markedAsRead);
    },
    {
      params: "adminError.ParamById",
      response: {
        200: "adminError.DetailResponse",
        403: "adminError.Error",
        404: "adminError.Error",
      },
      detail: {
        summary: "Mark an error log entry as read",
        tags: ["Admin", "Errors"],
      },
    },
  )
  .get(
    "/users",
    async ({ db, query, status }) => {
      const result = await AdminService.listUsers(db, parseUserListQuery(query));
      return status(200, result);
    },
    {
      query: "adminUser.QueryList",
      response: {
        200: "adminUser.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List platform users for admin management",
        tags: ["Admin", "Users"],
      },
    },
  )
  .get(
    "/users/:id",
    async ({ db, params, status }) => {
      const result = await AdminService.getUserById(db, params.id);

      if (!result) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      return status(200, result);
    },
    {
      params: "adminUser.ParamById",
      response: {
        200: "adminUser.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
      },
      detail: {
        summary: "Get detailed admin view of a user account",
        tags: ["Admin", "Users"],
      },
    },
  )
  .patch(
    "/users/:id/role",
    async ({ db, params, user, body, status }) => {
      const result = await AdminService.updateUserRole(db, user.id, params.id, body.role);

      if (result.error === USER_NOT_FOUND_MESSAGE) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      if (result.error === LAST_ADMIN_ROLE_CHANGE_MESSAGE) {
        return status(409, LAST_ADMIN_ROLE_CHANGE_MESSAGE);
      }

      if (!result.user) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      return status(200, result.user);
    },
    {
      params: "adminUser.ParamById",
      body: "adminUser.RoleUpdateInput",
      response: {
        200: "adminUser.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
        409: "adminUser.Error",
      },
      detail: {
        summary: "Update a user's role",
        tags: ["Admin", "Users"],
      },
    },
  )
  .patch(
    "/users/:id/password",
    async ({ db, params, user, body, request, status }) => {
      if (body.password !== body.confirmPassword) {
        return status(422, PASSWORD_CONFIRMATION_MISMATCH_MESSAGE);
      }

      const result = await AdminService.updateUserPassword(db, user.id, params.id, body.password, request.headers);

      if (result.error === USER_NOT_FOUND_MESSAGE) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      if (!result.user) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      return status(200, result.user);
    },
    {
      params: "adminUser.ParamById",
      body: "adminUser.PasswordUpdateInput",
      response: {
        200: "adminUser.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
        422: "adminUser.Error",
      },
      detail: {
        summary: "Set or replace a user's password",
        tags: ["Admin", "Users"],
      },
    },
  )
  .get(
    "/system-config",
    async ({ db, status }) => {
      const result = await AdminService.listSystemConfigurations(db);
      return status(200, result);
    },
    {
      response: {
        200: "adminConfig.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List application-wide system configuration entries",
        tags: ["Admin", "System Configuration"],
      },
    },
  )
  .patch(
    "/system-config/:name",
    async ({ db, params, user, body, status }) => {
      try {
        const result = await AdminService.updateSystemConfiguration(db, user.id, params.name, body.value);

        if (result.error === CONFIG_NOT_FOUND_MESSAGE) {
          return status(404, CONFIG_NOT_FOUND_MESSAGE);
        }

        if (!result.configuration) {
          return status(404, CONFIG_NOT_FOUND_MESSAGE);
        }

        return status(200, result.configuration);
      } catch (error: unknown) {
        if (error instanceof z.ZodError || error instanceof Error) {
          return status(422, error instanceof Error ? error.message : "Invalid configuration payload");
        }

        throw error;
      }
    },
    {
      params: "adminConfig.ParamByName",
      body: "adminConfig.UpdateInput",
      response: {
        200: "adminConfig.Entry",
        403: "adminUser.Error",
        404: "adminUser.Error",
        422: "adminUser.Error",
      },
      detail: {
        summary: "Update a system configuration entry",
        tags: ["Admin", "System Configuration"],
      },
    },
  )
  .get(
    "/features",
    async ({ db, status }) => {
      const result = await AdminService.listFeatureFlags(db);
      return status(200, result);
    },
    {
      response: {
        200: "adminFeature.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List runtime feature flags",
        tags: ["Admin", "Features"],
      },
    },
  )
  .put(
    "/features/:name",
    async ({ db, params, user, body, status }) => {
      const result = await AdminService.saveFeatureFlag(db, user.id, params.name, body);
      return status(200, result);
    },
    {
      params: "adminFeature.ParamByName",
      body: "adminFeature.SaveInput",
      response: {
        200: "adminFeature.Entry",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Create or update a runtime feature flag",
        tags: ["Admin", "Features"],
      },
    },
  )
  .get(
    "/audit-logs",
    async ({ db, query, status }) => {
      const result = await AdminService.listAuditLogs(db, parseAuditListQuery(query));
      return status(200, result);
    },
    {
      query: "adminAudit.QueryList",
      response: {
        200: "adminAudit.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List audit logs grouped by user, system, and database activity",
        tags: ["Admin", "Audit Logs"],
      },
    },
  )
  .get(
    "/audit-logs/:id",
    async ({ db, params, status }) => {
      const result = await AdminService.getAuditLogById(db, params.id);

      if (!result) {
        return status(404, AUDIT_LOG_NOT_FOUND_MESSAGE);
      }

      return status(200, result);
    },
    {
      params: "adminAudit.ParamById",
      response: {
        200: "adminAudit.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
      },
      detail: {
        summary: "Get detailed audit log metadata",
        tags: ["Admin", "Audit Logs"],
      },
    },
  )
  .get(
    "/analytics",
    async ({ db, query, status }) => {
      const result = await AdminService.getAnalyticsDashboard(db, parseAnalyticsQuery(query));
      return status(200, result);
    },
    {
      query: "adminAnalytics.Query",
      response: {
        200: "adminAnalytics.Response",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Fetch the admin analytics dashboard data",
        tags: ["Admin", "Analytics"],
      },
    },
  )
  // Queue metrics and worker health endpoints
  .get(
    "/queue/metrics",
    async ({ status }) => {
      const { getQueueStats, getCacheStats, isJobQueueInitialized } = await import("../jobs/queue");
      const { checkQueueDepth, getAlertStats } = await import("../jobs/alerts");

      const isInitialized = isJobQueueInitialized();
      const queueStats = await getQueueStats();
      const cacheStats = getCacheStats();
      const alertStats = getAlertStats();

      // Check queue depth and trigger alerts if needed
      for (const [key, stats] of Object.entries(queueStats)) {
        await checkQueueDepth(key, stats.pending);
        // Update hitRate in queue stats
        stats.hitRate = cacheStats.hitRate;
      }

      return status(200, {
        initialized: isInitialized,
        queues: queueStats,
        cache: cacheStats,
        alerts: alertStats,
      });
    },
    {
      response: {
        200: "adminQueue.MetricsResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Get job queue metrics and cache statistics",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .get(
    "/queue/alerts",
    async ({ status }) => {
      const { getAlertConfig, getAlertStats } = await import("../jobs/alerts");

      return status(200, {
        config: getAlertConfig(),
        stats: getAlertStats(),
      });
    },
    {
      response: {
        200: "adminQueue.AlertConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Get alert configuration and statistics",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/alerts/config",
    async ({ body, status }) => {
      const { configureAlerts } = await import("../jobs/alerts");

      configureAlerts({
        warningThreshold: body.warningThreshold,
        criticalThreshold: body.criticalThreshold,
        cooldownSeconds: body.cooldownSeconds,
        enabled: body.enabled,
        webhookUrl: body.webhookUrl,
        slackWebhookUrl: body.slackWebhookUrl,
      });

      return status(200, { success: true });
    },
    {
      body: t.Object({
        warningThreshold: t.Optional(t.Integer({ minimum: 1 })),
        criticalThreshold: t.Optional(t.Integer({ minimum: 1 })),
        cooldownSeconds: t.Optional(t.Integer({ minimum: 0 })),
        enabled: t.Optional(t.Boolean()),
        webhookUrl: t.Optional(t.Nullable(t.String())),
        slackWebhookUrl: t.Optional(t.Nullable(t.String())),
      }),
      response: {
        200: "adminQueue.UpdateConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Update alert configuration",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .get(
    "/queue/timeouts",
    async ({ status }) => {
      const { getTimeoutConfig, getActiveJobStats } = await import("../jobs/timeouts");

      return status(200, {
        config: getTimeoutConfig(),
        activeJobs: getActiveJobStats(),
      });
    },
    {
      response: {
        200: "adminQueue.TimeoutConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Get timeout configuration and active jobs",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/timeouts/config",
    async ({ body, status }) => {
      const { configureTimeouts } = await import("../jobs/timeouts");

      configureTimeouts({
        defaultTimeoutSeconds: body.defaultTimeoutSeconds,
        longTimeoutSeconds: body.longTimeoutSeconds,
        veryLongTimeoutSeconds: body.veryLongTimeoutSeconds,
        jobTimeouts: body.jobTimeouts,
      });

      return status(200, { success: true });
    },
    {
      body: t.Object({
        defaultTimeoutSeconds: t.Optional(t.Integer({ minimum: 1 })),
        longTimeoutSeconds: t.Optional(t.Integer({ minimum: 1 })),
        veryLongTimeoutSeconds: t.Optional(t.Integer({ minimum: 1 })),
        jobTimeouts: t.Optional(t.Record(t.String(), t.Integer())),
      }),
      response: {
        200: "adminQueue.UpdateConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Update timeout configuration",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .get(
    "/queue/rate-limits",
    async ({ status }) => {
      const { getAllRateLimitConfigs, getRateLimitStats } = await import("../jobs/rate-limit");

      return status(200, {
        configs: getAllRateLimitConfigs(),
        stats: getRateLimitStats(),
      });
    },
    {
      response: {
        200: "adminQueue.RateLimitConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Get rate limit configuration and statistics",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/rate-limits/config",
    async ({ body, status }) => {
      const { configureRateLimit } = await import("../jobs/rate-limit");

      if (body.jobName && body.config) {
        configureRateLimit(body.jobName as JobName, body.config);
      }

      return status(200, { success: true });
    },
    {
      body: t.Object({
        jobName: t.String(),
        config: t.Object({
          maxJobs: t.Optional(t.Integer({ minimum: 1 })),
          windowSeconds: t.Optional(t.Integer({ minimum: 1 })),
          backpressureThreshold: t.Optional(t.Integer({ minimum: 1 })),
        }),
      }),
      response: {
        200: "adminQueue.UpdateConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Update rate limit configuration for a job type",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .get(
    "/queue/batches",
    async ({ status }) => {
      const { getBatchStats } = await import("../jobs/batch");

      return status(200, getBatchStats());
    },
    {
      response: {
        200: "adminQueue.BatchStatsResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Get batch processing statistics",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/batches/flush",
    async ({ status }) => {
      const { flushAllBatches } = await import("../jobs/batch");

      await flushAllBatches();

      return status(200, { success: true });
    },
    {
      response: {
        200: "adminQueue.UpdateConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Flush all pending batch jobs immediately",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/batches/config",
    async ({ body, status }) => {
      const { configureBatch } = await import("../jobs/batch");

      if (body.jobName && body.config) {
        configureBatch(body.jobName as JobName, body.config);
      }

      return status(200, { success: true });
    },
    {
      body: t.Object({
        jobName: t.String(),
        config: t.Object({
          maxBatchSize: t.Optional(t.Integer({ minimum: 1 })),
          flushIntervalMs: t.Optional(t.Integer({ minimum: 100 })),
        }),
      }),
      response: {
        200: "adminQueue.UpdateConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Update batch configuration for a job type",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .get(
    "/queue/priorities",
    async ({ status }) => {
      const { getAllPriorityConfigs, getPriorityStats } = await import("../jobs/priority");
      const { getQueueStats } = await import("../jobs/queue");

      const queueStats = await getQueueStats();
      const queueDepths: Record<JobName, number> = {} as Record<JobName, number>;
      for (const [key, stats] of Object.entries(queueStats)) {
        queueDepths[key as JobName] = stats.pending;
      }

      return status(200, {
        configs: getAllPriorityConfigs(),
        stats: getPriorityStats(queueDepths),
      });
    },
    {
      response: {
        200: "adminQueue.PriorityConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Get priority configuration and current priorities",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/priorities/config",
    async ({ body, status }) => {
      const { configurePriority } = await import("../jobs/priority");

      if (body.jobName && body.config) {
        configurePriority(body.jobName as JobName, body.config);
      }

      return status(200, { success: true });
    },
    {
      body: t.Object({
        jobName: t.String(),
        config: t.Object({
          basePriority: t.Optional(t.Integer({ minimum: 0, maximum: 10 })),
          depthThreshold: t.Optional(t.Integer({ minimum: 1 })),
          depthBoost: t.Optional(t.Integer({ minimum: 1 })),
          maxBoost: t.Optional(t.Integer({ minimum: 1 })),
        }),
      }),
      response: {
        200: "adminQueue.UpdateConfigResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Update priority configuration for a job type",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .get(
    "/worker/health",
    async ({ status }) => {
      const { getQueueStats, getCacheStats, isJobQueueInitialized } = await import("../jobs/queue");

      const isInitialized = isJobQueueInitialized();
      const queueStats = await getQueueStats();
      const cacheStats = getCacheStats();

      // Calculate overall health
      const totalPublished = Object.values(queueStats).reduce((sum, q) => sum + q.jobsPublished, 0);
      const totalFailed = Object.values(queueStats).reduce((sum, q) => sum + q.jobsFailed, 0);
      const failureRate = totalPublished > 0 ? totalFailed / totalPublished : 0;

      const health = {
        status: (failureRate > 0.1 ? "degraded" : "healthy") as "healthy" | "degraded",
        failureRate: Math.round(failureRate * 10000) / 100, // 2 decimal places
        queueInitialized: isInitialized,
        totalJobsPublished: totalPublished,
        totalJobsFailed: totalFailed,
        cacheHitRate: Math.round(cacheStats.hitRate * 10000) / 100, // 2 decimal places
        timestamp: new Date().toISOString(),
      };

      // Convert dates to ISO strings (already done in getQueueStats)
      for (const key of Object.keys(queueStats)) {
        const queue = queueStats[key];
        if (queue) {
          queue.hitRate = cacheStats.hitRate;
        }
      }

      return status(200, {
        health,
        queues: queueStats,
        cache: cacheStats,
      });
    },
    {
      response: {
        200: "adminQueue.HealthResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Get worker health status and queue metrics",
        tags: ["Admin", "Worker"],
      },
    },
  )
  // Dead-letter queue endpoints
  .get(
    "/queue/dead-letter",
    async ({ query, status }) => {
      const { getDeadLetterJobs, getDeadLetterStats } = await import("../jobs/dead-letter");

      const limit = query.limit ? Number(query.limit) : 50;
      const offset = query.offset ? Number(query.offset) : 0;
      const jobName = query.jobName as JobName | undefined;

      const [jobsResult, statsResult] = await Promise.all([
        getDeadLetterJobs({ limit, offset, jobName }),
        getDeadLetterStats(),
      ]);

      // Convert dates to ISO strings
      const jobs = jobsResult.jobs.map((job) => ({
        ...job,
        failedAt: job.failedAt.toISOString(),
      }));

      const stats = {
        ...statsResult,
        oldestFailedAt: statsResult.oldestFailedAt?.toISOString() ?? null,
        newestFailedAt: statsResult.newestFailedAt?.toISOString() ?? null,
      };

      return status(200, {
        jobs,
        total: jobsResult.total,
        stats,
      });
    },
    {
      query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
        jobName: z.string().optional(),
      }),
      response: {
        200: "adminQueue.DeadLetterListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List dead-letter jobs",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .get(
    "/queue/dead-letter/:id",
    async ({ params, status }) => {
      const { getDeadLetterJob } = await import("../jobs/dead-letter");

      const job = await getDeadLetterJob(params.id);

      if (!job) {
        return status(404, "Dead-letter job not found");
      }

      // Convert date to ISO string
      const jobWithIsoDate = {
        ...job,
        failedAt: job.failedAt.toISOString(),
      };

      return status(200, jobWithIsoDate);
    },
    {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: "adminQueue.DeadLetterDetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
      },
      detail: {
        summary: "Get dead-letter job details",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/dead-letter/:id/retry",
    async ({ params, status }) => {
      const { retryDeadLetterJob } = await import("../jobs/dead-letter");

      const newJobId = await retryDeadLetterJob(params.id);

      if (!newJobId) {
        return status(404, "Dead-letter job not found");
      }

      return status(200, { success: true, newJobId });
    },
    {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: "adminQueue.RetryResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
      },
      detail: {
        summary: "Retry a dead-letter job",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .delete(
    "/queue/dead-letter/:id",
    async ({ params, status }) => {
      const { deleteDeadLetterJob } = await import("../jobs/dead-letter");

      const deleted = await deleteDeadLetterJob(params.id);

      if (!deleted) {
        return status(404, "Dead-letter job not found");
      }

      return status(200, { success: true });
    },
    {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: "adminQueue.DeleteResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
      },
      detail: {
        summary: "Delete a dead-letter job",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .post(
    "/queue/dead-letter/retry-all",
    async ({ query, status }) => {
      const { retryAllDeadLetterJobs } = await import("../jobs/dead-letter");

      const jobName = query.jobName as JobName | undefined;
      const result = await retryAllDeadLetterJobs(jobName);

      return status(200, result);
    },
    {
      query: z.object({
        jobName: z.string().optional(),
      }),
      response: {
        200: "adminQueue.RetryAllResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Retry all dead-letter jobs",
        tags: ["Admin", "Queue"],
      },
    },
  )
  .delete(
    "/queue/dead-letter/cleanup",
    async ({ query, status }) => {
      const { cleanupDeadLetterJobs } = await import("../jobs/dead-letter");

      const olderThanDays = query.olderThanDays ? Number(query.olderThanDays) : 30;
      const deleted = await cleanupDeadLetterJobs(olderThanDays);

      return status(200, { deleted });
    },
    {
      query: z.object({
        olderThanDays: z.string().optional(),
      }),
      response: {
        200: "adminQueue.CleanupResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Clean up old dead-letter jobs",
        tags: ["Admin", "Queue"],
      },
    },
  );

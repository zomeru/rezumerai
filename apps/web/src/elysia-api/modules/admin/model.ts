import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@rezumerai/types";
import Elysia, { t } from "elysia";

const Pagination = t.Object({
  page: t.Integer({ minimum: 1 }),
  pageSize: t.Integer({ minimum: 1 }),
  totalCount: t.Integer({ minimum: 0 }),
  totalPages: t.Integer({ minimum: 0 }),
});

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

const ErrorLogListItem = t.Object({
  id: t.String(),
  errorName: t.String(),
  createdAt: t.String({ format: "date-time" }),
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
  createdAt: t.String({ format: "date-time" }),
  isRead: t.Boolean(),
  readAt: t.Nullable(t.String({ format: "date-time" })),
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
  createdAt: t.String({ format: "date-time" }),
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
  createdAt: t.String({ format: "date-time" }),
});

const AdminUserDetail = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: "email" }),
  image: t.Nullable(t.String()),
  role: UserRole,
  emailVerified: t.Boolean(),
  status: AdminUserStatus,
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
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
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
  isEditable: t.Boolean(),
  validationMode: t.Union([t.Literal("KNOWN_SCHEMA"), t.Literal("RAW_JSON")]),
});

const AdminAiProviderOption = t.Object({
  id: t.String(),
  name: t.String(),
});

const AdminAiModel = t.Object({
  id: t.String(),
  name: t.String(),
  modelId: t.String(),
  providerId: t.String(),
  providerName: t.String(),
  isActive: t.Boolean(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
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
  createdAt: t.String({ format: "date-time" }),
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
  createdAt: t.String({ format: "date-time" }),
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

const AnalyticsTimeseriesPoint = t.Object({
  bucketStart: t.String({ format: "date-time" }),
  label: t.String(),
  requestCount: t.Integer({ minimum: 0 }),
  errorCount: t.Integer({ minimum: 0 }),
  errorRate: t.Number({ minimum: 0 }),
  averageResponseTimeMs: t.Number({ minimum: 0 }),
  activeUsers: t.Integer({ minimum: 0 }),
});

const AnalyticsEndpointUsage = t.Object({
  endpoint: t.String(),
  method: t.String(),
  requestCount: t.Integer({ minimum: 0 }),
  errorCount: t.Integer({ minimum: 0 }),
  errorRate: t.Number({ minimum: 0 }),
  averageResponseTimeMs: t.Number({ minimum: 0 }),
});

const AnalyticsBackgroundJob = t.Object({
  name: t.String(),
  runCount: t.Integer({ minimum: 0 }),
  successCount: t.Integer({ minimum: 0 }),
  failureCount: t.Integer({ minimum: 0 }),
  averageDurationMs: t.Number({ minimum: 0 }),
  lastRunAt: t.Nullable(t.String({ format: "date-time" })),
});

const AnalyticsDashboard = t.Object({
  timeframeDays: t.Integer({ minimum: 1 }),
  granularity: t.Union([t.Literal("hour"), t.Literal("day")]),
  summary: AnalyticsSummary,
  requestVolume: t.Array(AnalyticsTimeseriesPoint),
  endpointUsage: t.Array(AnalyticsEndpointUsage),
  backgroundJobs: t.Array(AnalyticsBackgroundJob),
});

export type ErrorLogListQueryInput = typeof ErrorLogListQuery.static;
export type UserListQueryInput = typeof UserListQuery.static;
export type AuditLogListQueryInput = typeof AuditLogListQuery.static;
export type AnalyticsQueryInput = typeof AnalyticsQuery.static;

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
  "adminAiModel.ParamById": ParamById,
  "adminAiModel.MutationInput": t.Object({
    providerId: t.String({ minLength: 1, pattern: ".*\\S.*" }),
    name: t.String({ minLength: 1, pattern: ".*\\S.*" }),
    modelId: t.String({ minLength: 1, pattern: ".*\\S.*" }),
    isActive: t.Boolean(),
  }),
  "adminAiModel.Entry": AdminAiModel,
  "adminAiModel.ProviderOption": AdminAiProviderOption,
  "adminAiModel.ListResponse": t.Object({
    models: t.Array(AdminAiModel),
    providers: t.Array(AdminAiProviderOption),
  }),
  "adminAiModel.DeleteResponse": t.Object({
    id: t.String(),
  }),
  "adminAiModel.Error": t.String(),
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
} as const);

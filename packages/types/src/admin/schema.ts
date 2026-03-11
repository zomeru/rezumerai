import { z } from "zod";
import { PasswordConfirmationSchema, PasswordSchema, UserRoleSchema } from "../user/schema";

export const AdminPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const AdminUserStatusSchema = z.enum(["ACTIVE"]);

export const AdminUserCreditsSchema = z.object({
  remaining: z.number().int().min(0),
  dailyLimit: z.number().int().positive(),
});

export const AdminUserListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: UserRoleSchema,
  resumeCount: z.number().int().min(0),
  credits: AdminUserCreditsSchema,
  status: AdminUserStatusSchema,
  createdAt: z.string(),
});

export const AdminUserListResponseSchema = z.object({
  items: z.array(AdminUserListItemSchema),
  pagination: AdminPaginationSchema,
});

export const AdminUserActivityItemSchema = z.object({
  id: z.string(),
  category: z.enum(["USER_ACTION", "SYSTEM_ACTIVITY", "DATABASE_CHANGE"]),
  eventType: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  endpoint: z.string().nullable(),
  method: z.string().nullable(),
  createdAt: z.string(),
});

export const AdminUserDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  role: UserRoleSchema,
  emailVerified: z.boolean(),
  status: AdminUserStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  resumeCount: z.number().int().min(0),
  credits: AdminUserCreditsSchema,
  recentActivity: z.array(AdminUserActivityItemSchema),
  recentAuditLogs: z.array(AdminUserActivityItemSchema),
});

export const AdminUserRoleUpdateInputSchema = z.object({
  role: UserRoleSchema,
});

export const AdminUserPasswordUpdateInputSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: PasswordConfirmationSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

export const SystemConfigurationEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  value: z.unknown(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isEditable: z.boolean(),
  validationMode: z.enum(["KNOWN_SCHEMA", "RAW_JSON"]),
});

export const SystemConfigurationListResponseSchema = z.object({
  items: z.array(SystemConfigurationEntrySchema),
});

export const UpdateSystemConfigurationInputSchema = z.object({
  value: z.unknown(),
});

export const AuditLogCategorySchema = z.enum(["USER_ACTION", "SYSTEM_ACTIVITY", "DATABASE_CHANGE"]);

export const AuditLogActorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  })
  .nullable();

export const AuditLogListItemSchema = z.object({
  id: z.string(),
  category: AuditLogCategorySchema,
  eventType: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  endpoint: z.string().nullable(),
  method: z.string().nullable(),
  serviceName: z.string().nullable(),
  actor: AuditLogActorSchema,
  createdAt: z.string(),
});

export const AuditLogListResponseSchema = z.object({
  items: z.array(AuditLogListItemSchema),
  pagination: AdminPaginationSchema,
  countsByCategory: z.record(AuditLogCategorySchema, z.number().int().min(0)),
});

export const AuditLogDetailSchema = z.object({
  id: z.string(),
  category: AuditLogCategorySchema,
  eventType: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  userId: z.string().nullable(),
  endpoint: z.string().nullable(),
  method: z.string().nullable(),
  serviceName: z.string().nullable(),
  requestMetadata: z.unknown().nullable(),
  beforeValues: z.unknown().nullable(),
  afterValues: z.unknown().nullable(),
  createdAt: z.string(),
  actor: AuditLogActorSchema,
});

export const AnalyticsSummarySchema = z.object({
  totalRequests: z.number().int().min(0),
  totalErrors: z.number().int().min(0),
  errorRate: z.number().min(0),
  activeUsers: z.number().int().min(0),
  averageResponseTimeMs: z.number().min(0),
  mostUsedEndpoint: z.string().nullable(),
});

export const AnalyticsTimeseriesPointSchema = z.object({
  bucketStart: z.string(),
  label: z.string(),
  requestCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  errorRate: z.number().min(0),
  averageResponseTimeMs: z.number().min(0),
  activeUsers: z.number().int().min(0),
});

export const AnalyticsEndpointUsageSchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  requestCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  errorRate: z.number().min(0),
  averageResponseTimeMs: z.number().min(0),
});

export const AnalyticsJobPerformanceSchema = z.object({
  name: z.string(),
  runCount: z.number().int().min(0),
  successCount: z.number().int().min(0),
  failureCount: z.number().int().min(0),
  averageDurationMs: z.number().min(0),
  lastRunAt: z.string().nullable(),
});

export const AnalyticsDashboardSchema = z.object({
  timeframeDays: z.number().int().positive(),
  granularity: z.enum(["hour", "day"]),
  summary: AnalyticsSummarySchema,
  requestVolume: z.array(AnalyticsTimeseriesPointSchema),
  endpointUsage: z.array(AnalyticsEndpointUsageSchema),
  backgroundJobs: z.array(AnalyticsJobPerformanceSchema),
});

export type AdminPagination = z.infer<typeof AdminPaginationSchema>;
export type AdminUserStatus = z.infer<typeof AdminUserStatusSchema>;
export type AdminUserCredits = z.infer<typeof AdminUserCreditsSchema>;
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;
export type AdminUserActivityItem = z.infer<typeof AdminUserActivityItemSchema>;
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;
export type AdminUserRoleUpdateInput = z.infer<typeof AdminUserRoleUpdateInputSchema>;
export type AdminUserPasswordUpdateInput = z.infer<typeof AdminUserPasswordUpdateInputSchema>;
export type SystemConfigurationEntry = z.infer<typeof SystemConfigurationEntrySchema>;
export type SystemConfigurationListResponse = z.infer<typeof SystemConfigurationListResponseSchema>;
export type UpdateSystemConfigurationInput = z.infer<typeof UpdateSystemConfigurationInputSchema>;
export type AuditLogCategory = z.infer<typeof AuditLogCategorySchema>;
export type AuditLogActor = z.infer<typeof AuditLogActorSchema>;
export type AuditLogListItem = z.infer<typeof AuditLogListItemSchema>;
export type AuditLogListResponse = z.infer<typeof AuditLogListResponseSchema>;
export type AuditLogDetail = z.infer<typeof AuditLogDetailSchema>;
export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;
export type AnalyticsTimeseriesPoint = z.infer<typeof AnalyticsTimeseriesPointSchema>;
export type AnalyticsEndpointUsage = z.infer<typeof AnalyticsEndpointUsageSchema>;
export type AnalyticsJobPerformance = z.infer<typeof AnalyticsJobPerformanceSchema>;
export type AnalyticsDashboard = z.infer<typeof AnalyticsDashboardSchema>;

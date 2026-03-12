import { Prisma, type PrismaClient } from "@rezumerai/database";
import type {
  AdminUserDetail,
  AdminUserListResponse,
  AnalyticsDashboard,
  AuditLogDetail,
  AuditLogListResponse,
  ErrorLogDetail,
  ErrorLogListResponse,
  SystemConfigurationEntry,
  SystemConfigurationListResponse,
} from "@rezumerai/types";
import {
  AiConfigurationSchema,
  ContentPageSchema,
  FaqInformationSchema,
  LandingPageInformationSchema,
  normalizeAiConfiguration,
  SYSTEM_CONFIGURATION_KEYS,
} from "@rezumerai/types";
import { z } from "zod";
import { setManagedUserPassword } from "@/lib/auth";
import { createAuditLog, toAuditSearchWhere } from "../../observability/audit";
import { mergeRequestContextMetadata } from "../../observability/request-context";
import { AiService } from "../ai/service";

const GLOBAL_CONFIGURATION_NAME = SYSTEM_CONFIGURATION_KEYS.GLOBAL_CONFIG;
type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;
const DEFAULT_ERROR_LOG_RETENTION_DAYS = 90;
const DEFAULT_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;
const DEFAULT_TIMEFRAME_DAYS = 7;
const MAX_TIMEFRAME_DAYS = 30;
const ACTIVE_ACCOUNT_STATUS = "ACTIVE" as const;
const ERROR_LOG_NOT_FOUND_MESSAGE = "Error log not found";
const USER_NOT_FOUND_MESSAGE = "User not found";
const AUDIT_LOG_NOT_FOUND_MESSAGE = "Audit log not found";
const CONFIG_NOT_FOUND_MESSAGE = "System configuration not found";
const LAST_ADMIN_ROLE_CHANGE_MESSAGE = "At least one admin must remain assigned to the system.";

const GLOBAL_CONFIGURATION_SCHEMA = z
  .object({
    ERROR_LOG_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650),
  })
  .passthrough();

const SYSTEM_CONFIGURATION_DEFINITIONS = {
  AI_CONFIG: {
    description:
      "Global AI models, workflow-specific prompts, and optimization configuration used across the application.",
    schema: AiConfigurationSchema,
  },
  GLOBAL_CONFIG: {
    description: "Application-wide operational settings, including backend retention windows and scheduled jobs.",
    schema: GLOBAL_CONFIGURATION_SCHEMA,
  },
  TOS_INFORMATION: {
    description: "Structured Terms of Service content for public pages and assistant responses.",
    schema: ContentPageSchema,
  },
  PRIVACY_POLICY_INFORMATION: {
    description: "Structured Privacy Policy content for public pages and assistant responses.",
    schema: ContentPageSchema,
  },
  FAQ_INFORMATION: {
    description: "Structured FAQ content used across public pages and assistant responses.",
    schema: FaqInformationSchema,
  },
  ABOUT_US_INFORMATION: {
    description: "Structured About page content for public pages and assistant responses.",
    schema: ContentPageSchema,
  },
  CONTACT_INFORMATION: {
    description: "Structured Contact page content for public pages and assistant responses.",
    schema: ContentPageSchema,
  },
  LANDING_PAGE_INFORMATION: {
    description: "Structured landing page content for the home page and assistant responses.",
    schema: LandingPageInformationSchema,
  },
} as const;

function isManagedConfigurationName(name: string): name is keyof typeof SYSTEM_CONFIGURATION_DEFINITIONS {
  return name in SYSTEM_CONFIGURATION_DEFINITIONS;
}

function isAuditLogCategoryValue(value: string): value is AuditLogCategoryValue {
  return value === "USER_ACTION" || value === "SYSTEM_ACTIVITY" || value === "DATABASE_CHANGE";
}

type AdminUserRole = "ADMIN" | "USER";
type AuditLogCategoryValue = "USER_ACTION" | "SYSTEM_ACTIVITY" | "DATABASE_CHANGE";

interface RawAuditLogRecord {
  id: string;
  category: AuditLogCategoryValue;
  eventType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  userId: string | null;
  endpoint: string | null;
  method: string | null;
  serviceName: string | null;
  requestMetadata: Prisma.JsonValue | null;
  beforeValues: Prisma.JsonValue | null;
  afterValues: Prisma.JsonValue | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ErrorLogDetailRecord {
  id: string;
  errorName: string;
  message: string;
  stackTraceJson: string;
  endpoint: string;
  method: string;
  functionName: string | null;
  queryParams: Prisma.JsonValue | null;
  requestBody: Prisma.JsonValue | null;
  headers: Prisma.JsonValue | null;
  userId: string | null;
  environment: "development" | "production";
  createdAt: Date;
  isRead: boolean;
  readAt: Date | null;
  readByUserId: string | null;
  readByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AnalyticsTimeseriesRow {
  bucket: Date;
  requestCount: number;
  errorCount: number;
  averageResponseTimeMs: number;
  activeUsers: number;
}

interface EndpointUsageRow {
  endpoint: string | null;
  method: string | null;
  requestCount: number;
  errorCount: number;
  averageResponseTimeMs: number;
}

interface BackgroundJobRow {
  eventType: string;
  runCount: number;
  failureCount: number;
  averageDurationMs: number;
  lastRunAt: Date | null;
}

export interface ListErrorLogsInput {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}

export interface ErrorLogCleanupResult {
  deletedCount: number;
  retentionDays: number;
  cutoffDate: Date;
}

export interface ListAdminUsersInput {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: AdminUserRole | null;
}

export interface ListAuditLogsInput {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: AuditLogCategoryValue | null;
}

export interface UpdateUserRoleResult {
  user: AdminUserDetail | null;
  error: string | null;
}

export interface UpdateUserPasswordResult {
  user: AdminUserDetail | null;
  error: string | null;
}

function toPage(page: number | undefined): number {
  if (!page || Number.isNaN(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function toPageSize(pageSize: number | undefined): number {
  if (!pageSize || Number.isNaN(pageSize)) {
    return DEFAULT_PAGE_SIZE;
  }

  const normalized = Math.floor(pageSize);

  if (normalized < MIN_PAGE_SIZE) {
    return MIN_PAGE_SIZE;
  }

  if (normalized > MAX_PAGE_SIZE) {
    return MAX_PAGE_SIZE;
  }

  return normalized;
}

function toTimeframeDays(timeframeDays: number | undefined): number {
  if (!timeframeDays || Number.isNaN(timeframeDays)) {
    return DEFAULT_TIMEFRAME_DAYS;
  }

  const normalized = Math.floor(timeframeDays);

  if (normalized < 1) {
    return 1;
  }

  if (normalized > MAX_TIMEFRAME_DAYS) {
    return MAX_TIMEFRAME_DAYS;
  }

  return normalized;
}

function formatBucketLabel(bucket: Date, granularity: "hour" | "day"): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(granularity === "hour" ? { hour: "numeric" as const } : {}),
  }).format(bucket);
}

function startOfBucket(date: Date, granularity: "hour" | "day"): Date {
  const bucket = new Date(date);

  if (granularity === "hour") {
    bucket.setMinutes(0, 0, 0);
    return bucket;
  }

  bucket.setHours(0, 0, 0, 0);
  return bucket;
}

function addBucket(bucket: Date, granularity: "hour" | "day"): Date {
  const next = new Date(bucket);

  if (granularity === "hour") {
    next.setHours(next.getHours() + 1);
    return next;
  }

  next.setDate(next.getDate() + 1);
  return next;
}

function toAdminUserCredits(remainingCredits: number, dailyLimit: number): { remaining: number; dailyLimit: number } {
  return {
    remaining: Math.max(0, remainingCredits),
    dailyLimit,
  };
}

function toAuditActor(user: RawAuditLogRecord["user"]): { id: string; name: string; email: string } | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function toAuditLogListItem(
  record: Pick<
    RawAuditLogRecord,
    | "id"
    | "category"
    | "eventType"
    | "action"
    | "resourceType"
    | "resourceId"
    | "endpoint"
    | "method"
    | "serviceName"
    | "createdAt"
    | "user"
  >,
) {
  return {
    id: record.id,
    category: record.category,
    eventType: record.eventType,
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    endpoint: record.endpoint,
    method: record.method,
    serviceName: record.serviceName,
    actor: toAuditActor(record.user),
    createdAt: record.createdAt.toISOString(),
  };
}

function toAuditLogDetail(record: RawAuditLogRecord): AuditLogDetail {
  return {
    ...toAuditLogListItem(record),
    userId: record.userId,
    requestMetadata: record.requestMetadata,
    beforeValues: record.beforeValues,
    afterValues: record.afterValues,
  };
}

function toUserActivityItem(
  record: Pick<
    RawAuditLogRecord,
    "id" | "category" | "eventType" | "action" | "resourceType" | "resourceId" | "endpoint" | "method" | "createdAt"
  >,
) {
  return {
    id: record.id,
    category: record.category,
    eventType: record.eventType,
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    endpoint: record.endpoint,
    method: record.method,
    createdAt: record.createdAt.toISOString(),
  };
}

function resolveConfigurationDescription(name: string, description: string | null): string | null {
  return description ?? (isManagedConfigurationName(name) ? SYSTEM_CONFIGURATION_DEFINITIONS[name].description : null);
}

function resolveConfigurationValidationMode(name: string): "KNOWN_SCHEMA" | "RAW_JSON" {
  return name in SYSTEM_CONFIGURATION_DEFINITIONS ? "KNOWN_SCHEMA" : "RAW_JSON";
}

function toStoredConfigurationValue(value: unknown): Prisma.JsonValue | null {
  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    return null;
  }

  return JSON.parse(serialized) as Prisma.JsonValue | null;
}

function parseConfigurationValue(name: string, value: unknown) {
  const definition = isManagedConfigurationName(name) ? SYSTEM_CONFIGURATION_DEFINITIONS[name] : null;
  const parsedValue =
    name === SYSTEM_CONFIGURATION_KEYS.AI_CONFIG
      ? normalizeAiConfiguration(value)
      : definition
        ? definition.schema.parse(value)
        : JSON.parse(JSON.stringify(value));
  const serialized = toStoredConfigurationValue(parsedValue);

  return serialized === null ? Prisma.JsonNull : serialized;
}

function toSystemConfigurationEntry(record: {
  id: string;
  name: string;
  description: string | null;
  value: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): SystemConfigurationEntry {
  const value =
    record.name === SYSTEM_CONFIGURATION_KEYS.AI_CONFIG ? normalizeAiConfiguration(record.value) : record.value;

  return {
    id: record.id,
    name: record.name,
    description: resolveConfigurationDescription(record.name, record.description),
    value,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    isEditable: true,
    validationMode: resolveConfigurationValidationMode(record.name),
  };
}

function buildTimeSeries(
  timeframeDays: number,
  granularity: "hour" | "day",
  rows: AnalyticsTimeseriesRow[],
  now: Date,
): AnalyticsDashboard["requestVolume"] {
  const rowMap = new Map(rows.map((row) => [startOfBucket(new Date(row.bucket), granularity).getTime(), row]));
  const endBucket = startOfBucket(now, granularity);
  const startDate = new Date(now);

  if (granularity === "hour") {
    startDate.setHours(startDate.getHours() - Math.max(1, timeframeDays * 24 - 1));
  } else {
    startDate.setDate(startDate.getDate() - Math.max(0, timeframeDays - 1));
  }

  let pointer = startOfBucket(startDate, granularity);
  const points: AnalyticsDashboard["requestVolume"] = [];

  while (pointer.getTime() <= endBucket.getTime()) {
    const row = rowMap.get(pointer.getTime());
    const requestCount = row?.requestCount ?? 0;
    const errorCount = row?.errorCount ?? 0;
    const errorRate = requestCount > 0 ? Number(((errorCount / requestCount) * 100).toFixed(2)) : 0;

    points.push({
      bucketStart: pointer.toISOString(),
      label: formatBucketLabel(pointer, granularity),
      requestCount,
      errorCount,
      errorRate,
      averageResponseTimeMs: row?.averageResponseTimeMs ?? 0,
      activeUsers: row?.activeUsers ?? 0,
    });

    pointer = addBucket(pointer, granularity);
  }

  return points;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Elysia best practice — abstract class avoids allocation when no state is stored.
export abstract class ErrorLogService {
  static async isAdmin(db: DatabaseClient, userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
      },
    });

    return user?.role === "ADMIN";
  }

  static async listErrorLogs(
    db: TransactionCapableDatabaseClient,
    input: ListErrorLogsInput = {},
  ): Promise<ErrorLogListResponse> {
    mergeRequestContextMetadata({ serviceName: "ErrorLogService.listErrorLogs" });
    const page = toPage(input.page);
    const pageSize = toPageSize(input.pageSize);

    const where: Prisma.ErrorLogWhereInput = {};

    if (typeof input.isRead === "boolean") {
      where.isRead = input.isRead;
    }

    const [totalCount, rows] = await db.$transaction([
      db.errorLog.count({ where }),
      db.errorLog.findMany({
        where,
        select: {
          id: true,
          errorName: true,
          createdAt: true,
          endpoint: true,
          method: true,
          functionName: true,
          isRead: true,
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        errorName: row.errorName,
        createdAt: row.createdAt.toISOString(),
        endpoint: row.endpoint,
        method: row.method,
        functionName: row.functionName,
        isRead: row.isRead,
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
      },
    };
  }

  static async getErrorLogById(db: DatabaseClient, id: string): Promise<ErrorLogDetail | null> {
    mergeRequestContextMetadata({ serviceName: "ErrorLogService.getErrorLogById" });
    const record = await db.errorLog.findUnique({
      where: { id },
      include: {
        readByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return ErrorLogService.toErrorLogDetail(record);
  }

  static async markAsRead(db: DatabaseClient, id: string, adminUserId: string): Promise<ErrorLogDetail | null> {
    mergeRequestContextMetadata({ serviceName: "ErrorLogService.markAsRead" });
    const existing = await db.errorLog.findUnique({
      where: { id },
      select: {
        id: true,
        isRead: true,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await db.errorLog.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        readByUserId: adminUserId,
      },
      include: {
        readByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      category: "USER_ACTION",
      eventType: "ADMIN_ERROR_MARKED_READ",
      action: "MARK_READ",
      resourceType: "ErrorLog",
      resourceId: updated.id,
      userId: adminUserId,
      endpoint: `/api/admin/errors/${updated.id}/read`,
      method: "PATCH",
      serviceName: "ErrorLogService.markAsRead",
      afterValues: {
        isRead: updated.isRead,
        readAt: updated.readAt?.toISOString() ?? null,
        readByUserId: updated.readByUserId,
      },
    });

    return ErrorLogService.toErrorLogDetail(updated);
  }

  static async getErrorLogRetentionDays(db: DatabaseClient): Promise<number> {
    const configuration = await db.systemConfiguration.findUnique({
      where: { name: GLOBAL_CONFIGURATION_NAME },
      select: {
        value: true,
      },
    });

    if (!configuration) {
      return DEFAULT_ERROR_LOG_RETENTION_DAYS;
    }

    const parsedConfiguration = GLOBAL_CONFIGURATION_SCHEMA.safeParse(configuration.value);

    if (!parsedConfiguration.success) {
      return DEFAULT_ERROR_LOG_RETENTION_DAYS;
    }

    return parsedConfiguration.data.ERROR_LOG_RETENTION_DAYS;
  }

  static async cleanupExpiredErrorLogs(db: DatabaseClient, now: Date = new Date()): Promise<ErrorLogCleanupResult> {
    const retentionDays = await ErrorLogService.getErrorLogRetentionDays(db);

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.errorLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      deletedCount: result.count,
      retentionDays,
      cutoffDate,
    };
  }

  private static toErrorLogDetail(record: ErrorLogDetailRecord): ErrorLogDetail {
    return {
      id: record.id,
      errorName: record.errorName,
      message: record.message,
      stackTraceJson: record.stackTraceJson,
      endpoint: record.endpoint,
      method: record.method,
      functionName: record.functionName,
      queryParams: record.queryParams,
      requestBody: record.requestBody,
      headers: record.headers,
      userId: record.userId,
      environment: record.environment,
      createdAt: record.createdAt.toISOString(),
      isRead: record.isRead,
      readAt: record.readAt?.toISOString() ?? null,
      readByUserId: record.readByUserId,
      readByUser: record.readByUser,
    };
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: Elysia best practice — abstract class avoids allocation when no state is stored.
export abstract class AdminService {
  static async listUsers(
    db: TransactionCapableDatabaseClient,
    input: ListAdminUsersInput = {},
  ): Promise<AdminUserListResponse> {
    mergeRequestContextMetadata({ serviceName: "AdminService.listUsers" });
    const page = toPage(input.page);
    const pageSize = toPageSize(input.pageSize);
    const search = input.search?.trim();
    const aiConfiguration = await AiService.getAiConfiguration(db);
    const dailyLimit = aiConfiguration.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (input.role) {
      where.role = input.role;
    }

    const [totalCount, rows] = await db.$transaction([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              resumes: true,
            },
          },
          aiTextOptimizerCredits: {
            select: {
              credits: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        resumeCount: row._count.resumes,
        credits: toAdminUserCredits(row.aiTextOptimizerCredits?.credits ?? dailyLimit, dailyLimit),
        status: ACTIVE_ACCOUNT_STATUS,
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
      },
    };
  }

  static async getUserById(db: DatabaseClient, userId: string): Promise<AdminUserDetail | null> {
    mergeRequestContextMetadata({ serviceName: "AdminService.getUserById" });
    const aiConfiguration = await AiService.getAiConfiguration(db);
    const dailyLimit = aiConfiguration.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT;

    const [user, recentActivity, recentAuditLogs] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              resumes: true,
            },
          },
          aiTextOptimizerCredits: {
            select: {
              credits: true,
            },
          },
        },
      }),
      db.auditLog.findMany({
        where: {
          userId,
          category: {
            in: ["USER_ACTION", "SYSTEM_ACTIVITY"],
          },
        },
        select: {
          id: true,
          category: true,
          eventType: true,
          action: true,
          resourceType: true,
          resourceId: true,
          endpoint: true,
          method: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 8,
      }),
      db.auditLog.findMany({
        where: {
          OR: [{ userId }, { resourceType: "User", resourceId: userId }],
        },
        select: {
          id: true,
          category: true,
          eventType: true,
          action: true,
          resourceType: true,
          resourceId: true,
          endpoint: true,
          method: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 12,
      }),
    ]);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
      status: ACTIVE_ACCOUNT_STATUS,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      resumeCount: user._count.resumes,
      credits: toAdminUserCredits(user.aiTextOptimizerCredits?.credits ?? dailyLimit, dailyLimit),
      recentActivity: recentActivity.map((item) => toUserActivityItem(item)),
      recentAuditLogs: recentAuditLogs.map((item) => toUserActivityItem(item)),
    };
  }

  static async updateUserRole(
    db: TransactionCapableDatabaseClient,
    actorUserId: string,
    targetUserId: string,
    role: AdminUserRole,
  ): Promise<UpdateUserRoleResult> {
    mergeRequestContextMetadata({ serviceName: "AdminService.updateUserRole" });

    const updateResult = await db.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          role: true,
        },
      });

      if (!targetUser) {
        return {
          user: null,
          error: USER_NOT_FOUND_MESSAGE,
        } as const;
      }

      if (targetUser.role === "ADMIN" && role !== "ADMIN") {
        const adminCount = await tx.user.count({
          where: {
            role: "ADMIN",
          },
        });

        if (adminCount <= 1) {
          return {
            user: null,
            error: LAST_ADMIN_ROLE_CHANGE_MESSAGE,
          } as const;
        }
      }

      await tx.user.update({
        where: { id: targetUserId },
        data: {
          role,
        },
      });

      return {
        user: await AdminService.getUserById(tx, targetUserId),
        error: null,
      } as const;
    });

    if (updateResult.user) {
      await createAuditLog({
        category: "USER_ACTION",
        eventType: "ADMIN_USER_ROLE_UPDATED",
        action: "ROLE_CHANGE",
        resourceType: "User",
        resourceId: targetUserId,
        userId: actorUserId,
        endpoint: `/api/admin/users/${targetUserId}/role`,
        method: "PATCH",
        serviceName: "AdminService.updateUserRole",
        afterValues: {
          role,
        },
      });
    }

    return updateResult;
  }

  static async updateUserPassword(
    db: DatabaseClient,
    actorUserId: string,
    targetUserId: string,
    newPassword: string,
    headers: Headers,
  ): Promise<UpdateUserPasswordResult> {
    mergeRequestContextMetadata({ serviceName: "AdminService.updateUserPassword" });

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
      },
    });

    if (!targetUser) {
      return {
        user: null,
        error: USER_NOT_FOUND_MESSAGE,
      };
    }

    const { createdCredentialAccount } = await setManagedUserPassword(targetUserId, newPassword, headers);
    const user = await AdminService.getUserById(db, targetUserId);

    if (user) {
      await createAuditLog({
        category: "USER_ACTION",
        eventType: "ADMIN_USER_PASSWORD_UPDATED",
        action: "PASSWORD_CHANGE",
        resourceType: "User",
        resourceId: targetUserId,
        userId: actorUserId,
        endpoint: `/api/admin/users/${targetUserId}/password`,
        method: "PATCH",
        serviceName: "AdminService.updateUserPassword",
        afterValues: {
          credentialAccountCreated: createdCredentialAccount,
        },
      });
    }

    return {
      user,
      error: null,
    };
  }

  static async listSystemConfigurations(db: DatabaseClient): Promise<SystemConfigurationListResponse> {
    mergeRequestContextMetadata({ serviceName: "AdminService.listSystemConfigurations" });
    const rows = await db.systemConfiguration.findMany({
      orderBy: [{ name: "asc" }],
    });

    return {
      items: rows.map((row) => toSystemConfigurationEntry(row)),
    };
  }

  static async updateSystemConfiguration(
    db: DatabaseClient,
    actorUserId: string,
    name: string,
    value: unknown,
  ): Promise<{ configuration: SystemConfigurationEntry | null; error: string | null }> {
    mergeRequestContextMetadata({ serviceName: "AdminService.updateSystemConfiguration" });
    const existing = await db.systemConfiguration.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        description: true,
        value: true,
      },
    });

    if (!existing && !(name in SYSTEM_CONFIGURATION_DEFINITIONS)) {
      return {
        configuration: null,
        error: CONFIG_NOT_FOUND_MESSAGE,
      };
    }

    const parsedValue = parseConfigurationValue(name, value);
    const description = resolveConfigurationDescription(name, existing?.description ?? null);

    const updated = await db.systemConfiguration.upsert({
      where: { name },
      update: {
        description,
        value: parsedValue,
      },
      create: {
        name,
        description,
        value: parsedValue,
      },
    });

    await createAuditLog({
      category: "USER_ACTION",
      eventType: "SYSTEM_CONFIGURATION_UPDATED",
      action: "UPDATE",
      resourceType: "SystemConfiguration",
      resourceId: updated.id,
      userId: actorUserId,
      endpoint: `/api/admin/system-config/${name}`,
      method: "PATCH",
      serviceName: "AdminService.updateSystemConfiguration",
      beforeValues: existing?.value ?? null,
      afterValues: updated.value,
    });

    return {
      configuration: toSystemConfigurationEntry(updated),
      error: null,
    };
  }

  static async listAuditLogs(
    db: TransactionCapableDatabaseClient,
    input: ListAuditLogsInput = {},
  ): Promise<AuditLogListResponse> {
    mergeRequestContextMetadata({ serviceName: "AdminService.listAuditLogs" });
    const page = toPage(input.page);
    const pageSize = toPageSize(input.pageSize);
    const searchWhere = input.search ? toAuditSearchWhere(input.search) : {};

    const where: Prisma.AuditLogWhereInput = {
      ...searchWhere,
      ...(input.category ? { category: input.category } : {}),
    };

    const [totalCount, categoryCounts, rows] = await db.$transaction([
      db.auditLog.count({ where }),
      db.auditLog.groupBy({
        by: ["category"],
        orderBy: {
          category: "asc",
        },
        _count: {
          _all: true,
        },
      }),
      db.auditLog.findMany({
        where,
        select: {
          id: true,
          category: true,
          eventType: true,
          action: true,
          resourceType: true,
          resourceId: true,
          endpoint: true,
          method: true,
          serviceName: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const countsByCategory: AuditLogListResponse["countsByCategory"] = {
      USER_ACTION: 0,
      SYSTEM_ACTIVITY: 0,
      DATABASE_CHANGE: 0,
    };

    for (const record of categoryCounts) {
      if (isAuditLogCategoryValue(record.category)) {
        const total =
          typeof record._count === "object" &&
          record._count !== null &&
          "_all" in record._count &&
          typeof record._count._all === "number"
            ? record._count._all
            : 0;

        countsByCategory[record.category] = total;
      }
    }

    return {
      items: rows.map((row) => toAuditLogListItem(row)),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
      },
      countsByCategory,
    };
  }

  static async getAuditLogById(db: DatabaseClient, auditId: string): Promise<AuditLogDetail | null> {
    mergeRequestContextMetadata({ serviceName: "AdminService.getAuditLogById" });
    const record = await db.auditLog.findUnique({
      where: { id: auditId },
      select: {
        id: true,
        category: true,
        eventType: true,
        action: true,
        resourceType: true,
        resourceId: true,
        userId: true,
        endpoint: true,
        method: true,
        serviceName: true,
        requestMetadata: true,
        beforeValues: true,
        afterValues: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return toAuditLogDetail(record);
  }

  static async getAnalyticsDashboard(db: DatabaseClient, timeframeDaysInput?: number): Promise<AnalyticsDashboard> {
    mergeRequestContextMetadata({ serviceName: "AdminService.getAnalyticsDashboard" });
    const timeframeDays = toTimeframeDays(timeframeDaysInput);
    const granularity: "hour" | "day" = timeframeDays <= 2 ? "hour" : "day";
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - timeframeDays);

    const [
      summaryAggregate,
      totalErrors,
      activeUsersResult,
      mostUsedEndpointResult,
      timeseriesRows,
      endpointUsageRows,
      backgroundJobs,
    ] = await Promise.all([
      db.analyticsEvent.aggregate({
        where: {
          source: "API_REQUEST",
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          _all: true,
        },
        _avg: {
          durationMs: true,
        },
      }),
      db.analyticsEvent.count({
        where: {
          source: "API_REQUEST",
          createdAt: {
            gte: startDate,
          },
          statusCode: {
            gte: 400,
          },
        },
      }),
      db.$queryRaw<Array<{ count: number }>>(Prisma.sql`
          SELECT COUNT(DISTINCT "userId")::int AS count
          FROM "analytics_event"
          WHERE "source" = 'API_REQUEST'
            AND "createdAt" >= ${startDate}
            AND "userId" IS NOT NULL
        `),
      db.$queryRaw<Array<{ endpoint: string | null; count: number }>>(Prisma.sql`
          SELECT "endpoint", COUNT(*)::int AS count
          FROM "analytics_event"
          WHERE "source" = 'API_REQUEST'
            AND "createdAt" >= ${startDate}
            AND "endpoint" IS NOT NULL
          GROUP BY "endpoint"
          ORDER BY count DESC, "endpoint" ASC
          LIMIT 1
        `),
      db.$queryRaw<AnalyticsTimeseriesRow[]>(Prisma.sql`
          SELECT
            date_trunc(${Prisma.raw(`'${granularity}'`)}, "createdAt") AS bucket,
            COUNT(*)::int AS "requestCount",
            COUNT(*) FILTER (WHERE "statusCode" >= 400)::int AS "errorCount",
            COALESCE(AVG("durationMs"), 0)::float AS "averageResponseTimeMs",
            COUNT(DISTINCT "userId")::int AS "activeUsers"
          FROM "analytics_event"
          WHERE "source" = 'API_REQUEST'
            AND "createdAt" >= ${startDate}
          GROUP BY 1
          ORDER BY 1 ASC
        `),
      db.$queryRaw<EndpointUsageRow[]>(Prisma.sql`
          SELECT
            "endpoint",
            COALESCE("method", 'UNKNOWN') AS method,
            COUNT(*)::int AS "requestCount",
            COUNT(*) FILTER (WHERE "statusCode" >= 400)::int AS "errorCount",
            COALESCE(AVG("durationMs"), 0)::float AS "averageResponseTimeMs"
          FROM "analytics_event"
          WHERE "source" = 'API_REQUEST'
            AND "createdAt" >= ${startDate}
            AND "endpoint" IS NOT NULL
          GROUP BY "endpoint", method
          ORDER BY "requestCount" DESC, "averageResponseTimeMs" DESC
          LIMIT 8
        `),
      db.$queryRaw<BackgroundJobRow[]>(Prisma.sql`
          SELECT
            "eventType",
            COUNT(*)::int AS "runCount",
            COUNT(*) FILTER (WHERE "errorCode" IS NOT NULL)::int AS "failureCount",
            COALESCE(AVG("durationMs"), 0)::float AS "averageDurationMs",
            MAX("createdAt") AS "lastRunAt"
          FROM "analytics_event"
          WHERE "source" = 'BACKGROUND_JOB'
            AND "createdAt" >= ${startDate}
          GROUP BY "eventType"
          ORDER BY "lastRunAt" DESC NULLS LAST
        `),
    ]);

    const totalRequests = summaryAggregate._count._all;
    const errorRate = totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0;

    return {
      timeframeDays,
      granularity,
      summary: {
        totalRequests,
        totalErrors,
        errorRate,
        activeUsers: activeUsersResult[0]?.count ?? 0,
        averageResponseTimeMs: Number((summaryAggregate._avg.durationMs ?? 0).toFixed(2)),
        mostUsedEndpoint: mostUsedEndpointResult[0]?.endpoint ?? null,
      },
      requestVolume: buildTimeSeries(timeframeDays, granularity, timeseriesRows, now),
      endpointUsage: endpointUsageRows.map((row) => ({
        endpoint: row.endpoint ?? "Unknown endpoint",
        method: row.method ?? "UNKNOWN",
        requestCount: row.requestCount,
        errorCount: row.errorCount,
        errorRate: row.requestCount > 0 ? Number(((row.errorCount / row.requestCount) * 100).toFixed(2)) : 0,
        averageResponseTimeMs: Number(row.averageResponseTimeMs.toFixed(2)),
      })),
      backgroundJobs: backgroundJobs.map((row) => ({
        name: row.eventType,
        runCount: row.runCount,
        successCount: row.runCount - row.failureCount,
        failureCount: row.failureCount,
        averageDurationMs: Number(row.averageDurationMs.toFixed(2)),
        lastRunAt: row.lastRunAt?.toISOString() ?? null,
      })),
    };
  }

  static readonly messages = {
    ERROR_LOG_NOT_FOUND_MESSAGE,
    USER_NOT_FOUND_MESSAGE,
    AUDIT_LOG_NOT_FOUND_MESSAGE,
    CONFIG_NOT_FOUND_MESSAGE,
    LAST_ADMIN_ROLE_CHANGE_MESSAGE,
  } as const;
}

import type { Prisma, PrismaClient } from "@rezumerai/database";
import type { ErrorLogDetail, ErrorLogListResponse } from "@rezumerai/types";
import { z } from "zod";

const GLOBAL_CONFIGURATION_NAME = "GLOBAL_CONFIG";
const DEFAULT_ERROR_LOG_RETENTION_DAYS = 90;
const DEFAULT_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

const GLOBAL_CONFIGURATION_SCHEMA = z
  .object({
    ERROR_LOG_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650),
  })
  .passthrough();

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

// biome-ignore lint/complexity/noStaticOnlyClass: Elysia best practice — abstract class avoids allocation when no state is stored.
export abstract class ErrorLogService {
  static async isAdmin(db: PrismaClient, userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
      },
    });

    return user?.role === "ADMIN";
  }

  static async listErrorLogs(db: PrismaClient, input: ListErrorLogsInput = {}): Promise<ErrorLogListResponse> {
    const page = ErrorLogService.toPage(input.page);
    const pageSize = ErrorLogService.toPageSize(input.pageSize);

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

  static async getErrorLogById(db: PrismaClient, id: string): Promise<ErrorLogDetail | null> {
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

  static async markAsRead(db: PrismaClient, id: string, adminUserId: string): Promise<ErrorLogDetail | null> {
    const existing = await db.errorLog.findUnique({
      where: { id },
      select: {
        id: true,
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

    return ErrorLogService.toErrorLogDetail(updated);
  }

  static async getErrorLogRetentionDays(db: PrismaClient): Promise<number> {
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

  static async cleanupExpiredErrorLogs(db: PrismaClient, now: Date = new Date()): Promise<ErrorLogCleanupResult> {
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

  private static toPage(page: number | undefined): number {
    if (!page || Number.isNaN(page) || page < 1) {
      return 1;
    }

    return Math.floor(page);
  }

  private static toPageSize(pageSize: number | undefined): number {
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
}

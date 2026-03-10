import { tool } from "@openrouter/sdk";
import { z } from "zod";
import {
  clampLimit,
  createToolCollectionResult,
  createToolDetailResult,
  createToolMetricResult,
  limitSchema,
  searchSchema,
  userIdSchema,
} from "../shared";
import type { AssistantToolOptions } from "../types";

export function createAdminAssistantTools(options: AssistantToolOptions) {
  const { db } = options;

  return [
    tool({
      name: "getRecentUsers",
      description: "List recent users.",
      inputSchema: limitSchema,
      execute: async ({ limit }) => {
        const rows = await db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: clampLimit(limit, 5),
        });

        return createToolCollectionResult(
          "user",
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            createdAt: row.createdAt.toISOString(),
          })),
          `Recent users (up to ${clampLimit(limit, 5)}).`,
        );
      },
    }),
    tool({
      name: "searchUsers",
      description: "Search users.",
      inputSchema: searchSchema,
      execute: async ({ query }) => {
        const rows = await db.user.findMany({
          where: {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        return createToolCollectionResult(
          "user",
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            createdAt: row.createdAt.toISOString(),
          })),
          `User search results for "${query}".`,
          { query },
        );
      },
    }),
    tool({
      name: "getUserAccountSummary",
      description: "Read one user summary.",
      inputSchema: userIdSchema,
      execute: async ({ userId: targetUserId }) => {
        const user = await db.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            aiTextOptimizerCredits: {
              select: { credits: true },
            },
            _count: {
              select: { resumes: true },
            },
          },
        });

        if (!user) {
          throw new Error("User not found.");
        }

        return createToolDetailResult(
          "user",
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            resumeCount: user._count.resumes,
            credits: user.aiTextOptimizerCredits?.credits ?? null,
            createdAt: user.createdAt.toISOString(),
          },
          `Account summary for ${user.email}.`,
        );
      },
    }),
    tool({
      name: "getUserResumes",
      description: "List a user's resumes.",
      inputSchema: z.object({
        userId: z.string().trim().min(1),
        limit: z.number().int().min(1).max(10).default(5),
      }),
      execute: async ({ userId: targetUserId, limit }) => {
        const rows = await db.resume.findMany({
          where: { userId: targetUserId },
          select: { id: true, title: true, updatedAt: true, public: true },
          orderBy: { updatedAt: "desc" },
          take: clampLimit(limit, 5),
        });

        return createToolCollectionResult(
          "resume",
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Untitled resume",
            updatedAt: row.updatedAt.toISOString(),
            visibility: row.public ? "public" : "private",
          })),
          `Resumes for user ${targetUserId}.`,
          { userId: targetUserId },
        );
      },
    }),
    tool({
      name: "searchAllResumes",
      description: "Search all resumes.",
      inputSchema: searchSchema,
      execute: async ({ query }) => {
        const rows = await db.resume.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { professionalSummary: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            updatedAt: true,
            user: { select: { email: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        });

        return createToolCollectionResult(
          "resume",
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Untitled resume",
            ownerEmail: row.user.email,
            updatedAt: row.updatedAt.toISOString(),
          })),
          `Global resume search results for "${query}".`,
          { query },
        );
      },
    }),
    tool({
      name: "getSystemConfiguration",
      description: "List system config.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db.systemConfiguration.findMany({
          select: { name: true, updatedAt: true },
          orderBy: { name: "asc" },
          take: 20,
        });

        return createToolCollectionResult(
          "system_configuration",
          rows.map((row) => ({
            name: row.name,
            updatedAt: row.updatedAt.toISOString(),
          })),
          "System configuration entries.",
        );
      },
    }),
    tool({
      name: "getAuditLogSummary",
      description: "Read recent audit logs.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db.auditLog.findMany({
          select: {
            id: true,
            eventType: true,
            action: true,
            resourceType: true,
            createdAt: true,
            user: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        return createToolCollectionResult(
          "audit_log",
          rows.map((row) => ({
            id: row.id,
            eventType: row.eventType,
            action: row.action,
            resourceType: row.resourceType,
            actorEmail: row.user?.email ?? null,
            createdAt: row.createdAt.toISOString(),
          })),
          "Recent audit log entries.",
        );
      },
    }),
    tool({
      name: "getAnalyticsSummary",
      description: "Read analytics summary.",
      inputSchema: z.object({}),
      execute: async () => {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [requestCount, errorCount, activeUsers] = await Promise.all([
          db.analyticsEvent.count({ where: { createdAt: { gte: since } } }),
          db.analyticsEvent.count({
            where: { createdAt: { gte: since }, statusCode: { gte: 400 } },
          }),
          db.analyticsEvent.findMany({
            where: { createdAt: { gte: since }, userId: { not: null } },
            distinct: ["userId"],
            select: { userId: true },
          }),
        ]);

        return createToolMetricResult(
          "analytics_summary",
          {
            timeframeDays: 7,
            requestCount,
            errorCount,
            activeUsers: activeUsers.length,
          },
          "High-level analytics summary for the last 7 days.",
        );
      },
    }),
    tool({
      name: "getUsersWithLowCredits",
      description: "List users with low credits.",
      inputSchema: z.object({
        threshold: z.number().int().min(0).max(100).default(10),
      }),
      execute: async ({ threshold }) => {
        const rows = await db.user.findMany({
          where: {
            aiTextOptimizerCredits: {
              is: {
                credits: {
                  lte: threshold,
                },
              },
            },
          },
          select: {
            id: true,
            email: true,
            role: true,
            aiTextOptimizerCredits: {
              select: { credits: true },
            },
          },
          orderBy: {
            aiTextOptimizerCredits: {
              credits: "asc",
            },
          },
          take: 10,
        });

        return createToolCollectionResult(
          "user_credit_balance",
          rows.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
            credits: row.aiTextOptimizerCredits?.credits ?? null,
          })),
          `Users with credits at or below ${threshold}.`,
          { threshold },
        );
      },
    }),
  ] as const;
}

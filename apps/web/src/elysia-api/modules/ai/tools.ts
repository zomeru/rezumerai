import { tool } from "@openrouter/sdk";
import type { PrismaClient } from "@rezumerai/database";
import { type AssistantRoleScope, PublicContentTopicSchema, ResumeSectionTargetSchema } from "@rezumerai/types";
import { z } from "zod";
import { getPublicAppContent, searchPublicFaq } from "@/lib/system-content";
import {
  analyzeJobDescriptionText,
  buildDraftPatch,
  buildResumeSnapshot,
  compactText,
  getResumeSectionSource,
  matchResumeSnapshotToJob,
} from "./utils";

type UserRole = "ADMIN" | "USER";
type ToolEntityRecord = Record<string, unknown>;

interface AssistantToolOptions {
  db: PrismaClient;
  scope: AssistantRoleScope;
  userId: string | null;
  role: UserRole | null;
  getOptimizationCredits: () => Promise<{
    remainingCredits: number;
    dailyLimit: number;
  } | null>;
  getCurrentModelSettings: () => Promise<{
    selectedModelId: string;
    models: string[];
  } | null>;
}

interface CopilotToolOptions {
  db: PrismaClient;
  userId: string;
  getOptimizationCredits: () => Promise<{
    remainingCredits: number;
    dailyLimit: number;
  }>;
}

const limitSchema = z.object({
  limit: z.number().int().min(1).max(10).default(5),
});

const searchSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

const userIdSchema = z.object({
  userId: z.string().trim().min(1),
});

const resumeIdSchema = z.object({
  resumeId: z.string().trim().min(1),
});

async function getOwnedResume(db: PrismaClient, userId: string, resumeId: string) {
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      personalInfo: true,
      experience: true,
      education: true,
      project: true,
    },
  });

  if (!resume) {
    throw new Error("Resume not found.");
  }

  return resume;
}

function clampLimit(limit: number | undefined, fallback: number): number {
  return Math.min(10, Math.max(1, limit ?? fallback));
}

function createToolCollectionResult<T extends ToolEntityRecord>(
  entity: string,
  items: T[],
  summary: string,
  meta?: Record<string, unknown>,
) {
  return {
    type: "collection" as const,
    entity,
    summary,
    count: items.length,
    items,
    meta: meta ?? null,
  };
}

function createToolDetailResult<T extends ToolEntityRecord>(entity: string, item: T, summary: string) {
  return {
    type: "detail" as const,
    entity,
    summary,
    item,
  };
}

function createToolMetricResult<T extends ToolEntityRecord>(entity: string, data: T, summary: string) {
  return {
    type: "metric" as const,
    entity,
    summary,
    data,
  };
}

export function createCopilotTools(options: CopilotToolOptions) {
  const { db, userId, getOptimizationCredits } = options;

  return [
    tool({
      name: "getResumeSection",
      description: "Load one resume section.",
      inputSchema: z.object({
        resumeId: z.string().trim().min(1),
        target: ResumeSectionTargetSchema,
      }),
      execute: async ({ resumeId, target }) => {
        const resume = await getOwnedResume(db, userId, resumeId);
        return getResumeSectionSource(resume, target);
      },
    }),
    tool({
      name: "getResume",
      description: "Load compact resume overview.",
      inputSchema: resumeIdSchema,
      execute: async ({ resumeId }) => {
        const resume = await getOwnedResume(db, userId, resumeId);
        return buildResumeSnapshot(resume);
      },
    }),
    tool({
      name: "analyzeJobDescription",
      description: "Extract job priorities.",
      inputSchema: z.object({
        text: z.string().trim().min(20).max(12000),
      }),
      execute: async ({ text }) => analyzeJobDescriptionText(text),
    }),
    tool({
      name: "matchResumeToJob",
      description: "Compare resume to job.",
      inputSchema: z.object({
        resumeId: z.string().trim().min(1),
        jobDescription: z.string().trim().min(20).max(12000),
      }),
      execute: async ({ resumeId, jobDescription }) => {
        const resume = await getOwnedResume(db, userId, resumeId);
        return matchResumeSnapshotToJob(buildResumeSnapshot(resume), analyzeJobDescriptionText(jobDescription));
      },
    }),
    tool({
      name: "prepareDraftSectionUpdate",
      description: "Build reviewable patch.",
      inputSchema: z.object({
        target: ResumeSectionTargetSchema,
        suggestedText: z.string().trim().min(1).max(4000),
      }),
      execute: async ({ target, suggestedText }) => buildDraftPatch(target, suggestedText),
    }),
    tool({
      name: "getOptimizationCredits",
      description: "Read remaining credits.",
      inputSchema: z.object({}),
      execute: async () => getOptimizationCredits(),
    }),
  ] as const;
}

export function createAssistantTools(options: AssistantToolOptions) {
  const { db, scope, userId, role, getOptimizationCredits, getCurrentModelSettings } = options;

  const publicTools = [
    tool({
      name: "getPublicAppContent",
      description: "Read public app content.",
      inputSchema: z.object({
        topic: PublicContentTopicSchema,
      }),
      execute: async ({ topic }) =>
        createToolDetailResult("public_content", await getPublicAppContent(topic, db), `Public content for ${topic}.`),
    }),
    tool({
      name: "searchPublicFaq",
      description: "Search public FAQ.",
      inputSchema: searchSchema,
      execute: async ({ query }) =>
        createToolCollectionResult("faq_entry", await searchPublicFaq(query, db), `FAQ matches for "${query}".`, {
          query,
        }),
    }),
  ] as const;

  if (scope === "PUBLIC" || !userId) {
    return publicTools;
  }

  const userTools = [
    tool({
      name: "getMyRecentResumes",
      description: "List my recent resumes.",
      inputSchema: limitSchema,
      execute: async ({ limit }) => {
        const rows = await db.resume.findMany({
          where: { userId },
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
          `Recent resumes for the current user (up to ${clampLimit(limit, 5)}).`,
        );
      },
    }),
    tool({
      name: "getMyResume",
      description: "Read one of my resumes.",
      inputSchema: resumeIdSchema,
      execute: async ({ resumeId }) => {
        const resume = await getOwnedResume(db, userId, resumeId);
        const snapshot = buildResumeSnapshot(resume);

        return createToolDetailResult(
          "resume",
          {
            id: resume.id,
            title: resume.title || "Untitled resume",
            updatedAt: resume.updatedAt.toISOString(),
            ...snapshot,
          },
          `Resume details for ${resume.title || "Untitled resume"}.`,
        );
      },
    }),
    tool({
      name: "getMyRecentDrafts",
      description: "List my latest drafts.",
      inputSchema: limitSchema,
      execute: async ({ limit }) => {
        const rows = await db.resume.findMany({
          where: { userId, public: false },
          select: { id: true, title: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: clampLimit(limit, 5),
        });

        return createToolCollectionResult(
          "draft",
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Untitled draft",
            updatedAt: row.updatedAt.toISOString(),
          })),
          `Recent private drafts for the current user (up to ${clampLimit(limit, 5)}).`,
        );
      },
    }),
    tool({
      name: "getMyOptimizationCredits",
      description: "Read my AI credits.",
      inputSchema: z.object({}),
      execute: async () =>
        createToolMetricResult(
          "optimization_credits",
          (await getOptimizationCredits()) ?? {
            remainingCredits: null,
            dailyLimit: null,
          },
          "Current AI optimization credit balance.",
        ),
    }),
    tool({
      name: "getMyCurrentModelSettings",
      description: "Read my model settings.",
      inputSchema: z.object({}),
      execute: async () =>
        createToolMetricResult(
          "ai_model_settings",
          (await getCurrentModelSettings()) ?? {
            selectedModelId: null,
            models: [],
          },
          "Current selected AI model and available model IDs for the user.",
        ),
    }),
    tool({
      name: "searchMyResumes",
      description: "Search my resumes.",
      inputSchema: searchSchema,
      execute: async ({ query }) => {
        const rows = await db.resume.findMany({
          where: {
            userId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { professionalSummary: { contains: query, mode: "insensitive" } },
              { skills: { has: query } },
            ],
          },
          select: {
            id: true,
            title: true,
            updatedAt: true,
            professionalSummary: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        });

        return createToolCollectionResult(
          "resume",
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Untitled resume",
            updatedAt: row.updatedAt.toISOString(),
            summary: compactText(row.professionalSummary ?? "", 160),
          })),
          `Resume search results for "${query}".`,
          { query },
        );
      },
    }),
  ] as const;

  if (scope !== "ADMIN" || role !== "ADMIN") {
    return [...publicTools, ...userTools] as const;
  }

  const adminTools = [
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

  return [...publicTools, ...userTools, ...adminTools] as const;
}

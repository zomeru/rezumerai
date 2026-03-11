import type { AiConfiguration, AssistantRoleScope, ResumeSectionTarget } from "@rezumerai/types";
import { ResumeSectionTargetSchema } from "@rezumerai/types";
import { type ToolSet, tool } from "ai";
import { z } from "zod";
import { getPublicAppContent, searchPublicFaq } from "@/lib/system-content";
import {
  analyzeJobDescriptionText,
  buildDraftPatch,
  buildResumeSnapshot,
  compactText,
  getResumeSectionSource,
  matchResumeSnapshotToJob,
} from "../utils";
import { getOwnedResume } from "./shared/helpers";
import { createToolCollectionResult, createToolDetailResult, createToolMetricResult } from "./shared/result-builders";
import { limitSchema, resumeIdSchema, searchSchema, userIdSchema } from "./shared/schemas";
import type { DatabaseClient, UserRole } from "./types/common";

type AiToolKind = "assistant" | "copilot";
type OptimizationCredits = {
  remainingCredits: number;
  dailyLimit: number;
};

interface AiToolContext {
  db: DatabaseClient;
  role: UserRole | null;
  scope: AssistantRoleScope;
  userId: string | null;
  getAiConfiguration: () => Promise<AiConfiguration | null>;
  getCurrentModelSettings: () => Promise<{
    selectedModelId: string;
    models: string[];
  } | null>;
  getOptimizationCredits: () => Promise<OptimizationCredits | null>;
}

interface AiToolDescriptor {
  description: string;
  kinds: readonly AiToolKind[];
  scopes: readonly AssistantRoleScope[];
  requiresAuth?: boolean;
  create: (context: AiToolContext) => ToolSet[string];
}

function canUseTool(descriptor: AiToolDescriptor, context: AiToolContext, kind: AiToolKind): boolean {
  if (!descriptor.kinds.includes(kind)) {
    return false;
  }

  if (!descriptor.scopes.includes(context.scope)) {
    return false;
  }

  if (descriptor.requiresAuth && !context.userId) {
    return false;
  }

  if (context.scope !== "ADMIN" && descriptor.scopes.includes("ADMIN") && !descriptor.scopes.includes(context.scope)) {
    return false;
  }

  return true;
}

const toolDefinitions = {
  getPublicAppOverview: {
    description: "Read the public Rezumerai app overview from stored public site content.",
    kinds: ["assistant"],
    scopes: ["PUBLIC", "USER", "ADMIN"],
    create: (context) =>
      tool({
        description: "Read the public Rezumerai app overview from stored public site content.",
        inputSchema: z.object({}),
        execute: async () =>
          createToolDetailResult(
            "public_app_overview",
            await getPublicAppContent("landing", context.db),
            "Grounded public overview of Rezumerai.",
          ),
      }),
  },
  getPublicFaq: {
    description: "Search or read the public FAQ content.",
    kinds: ["assistant"],
    scopes: ["PUBLIC", "USER", "ADMIN"],
    create: () =>
      tool({
        description: "Search the public FAQ content.",
        inputSchema: searchSchema,
        execute: async ({ query }) =>
          createToolCollectionResult("faq_entry", await searchPublicFaq(query), `FAQ matches for "${query}".`, {
            query,
          }),
      }),
  },
  listMyRecentResumes: {
    description: "List the signed-in user's recent resumes.",
    kinds: ["assistant"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "List the signed-in user's recent resumes.",
        inputSchema: limitSchema,
        execute: async ({ limit }) => {
          const rows = await context.db.resume.findMany({
            where: { userId: context.userId ?? "" },
            select: { id: true, title: true, updatedAt: true, public: true },
            orderBy: { updatedAt: "desc" },
            take: Math.min(10, Math.max(1, limit ?? 5)),
          });

          return createToolCollectionResult(
            "resume",
            rows.map((row) => ({
              id: row.id,
              title: row.title || "Untitled resume",
              updatedAt: row.updatedAt.toISOString(),
              visibility: row.public ? "public" : "private",
            })),
            `Recent resumes for the current user (up to ${Math.min(10, Math.max(1, limit ?? 5))}).`,
          );
        },
      }),
  },
  getMyCurrentModelSettings: {
    description: "Read the current signed-in user's AI model settings.",
    kinds: ["assistant"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Read the current signed-in user's AI model settings.",
        inputSchema: z.object({}),
        execute: async () =>
          createToolMetricResult(
            "ai_model_settings",
            (await context.getCurrentModelSettings()) ?? {
              selectedModelId: null,
              models: [],
            },
            "Current selected AI model and available model IDs for the user.",
          ),
      }),
  },
  getMyOptimizationCredits: {
    description: "Read the signed-in user's current AI credit balance.",
    kinds: ["assistant"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Read the signed-in user's current AI credit balance.",
        inputSchema: z.object({}),
        execute: async () =>
          createToolMetricResult(
            "optimization_credits",
            (await context.getOptimizationCredits()) ?? {
              remainingCredits: null,
              dailyLimit: null,
            },
            "Current AI optimization credit balance.",
          ),
      }),
  },
  listMyRecentDrafts: {
    description: "List the signed-in user's recent private drafts.",
    kinds: ["assistant"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "List the signed-in user's recent private drafts.",
        inputSchema: limitSchema,
        execute: async ({ limit }) => {
          const rows = await context.db.resume.findMany({
            where: { userId: context.userId ?? "", public: false },
            select: { id: true, title: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: Math.min(10, Math.max(1, limit ?? 5)),
          });

          return createToolCollectionResult(
            "draft",
            rows.map((row) => ({
              id: row.id,
              title: row.title || "Untitled draft",
              updatedAt: row.updatedAt.toISOString(),
            })),
            `Recent private drafts for the current user (up to ${Math.min(10, Math.max(1, limit ?? 5))}).`,
          );
        },
      }),
  },
  searchMyResumes: {
    description: "Search the signed-in user's resumes.",
    kinds: ["assistant"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Search the signed-in user's resumes.",
        inputSchema: searchSchema,
        execute: async ({ query }) => {
          const rows = await context.db.resume.findMany({
            where: {
              userId: context.userId ?? "",
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
  },
  listRegisteredUsers: {
    description: "List registered users. Admin only.",
    kinds: ["assistant"],
    scopes: ["ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "List registered users. Admin only.",
        inputSchema: limitSchema,
        execute: async ({ limit }) => {
          const rows = await context.db.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: Math.min(100, Math.max(1, limit ?? 20)),
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
            "Registered users.",
          );
        },
      }),
  },
  getAnalyticsSummary: {
    description: "Read the analytics summary. Admin only.",
    kinds: ["assistant"],
    scopes: ["ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Read the analytics summary. Admin only.",
        inputSchema: z.object({}),
        execute: async () => {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const [requestCount, errorCount, activeUsers] = await Promise.all([
            context.db.analyticsEvent.count({ where: { createdAt: { gte: since } } }),
            context.db.analyticsEvent.count({ where: { createdAt: { gte: since }, statusCode: { gte: 400 } } }),
            context.db.analyticsEvent.findMany({
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
  },
  getAiConfiguration: {
    description: "Read the active AI configuration. Admin only.",
    kinds: ["assistant"],
    scopes: ["ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Read the active AI configuration. Admin only.",
        inputSchema: z.object({}),
        execute: async () =>
          createToolMetricResult(
            "ai_configuration",
            (await context.getAiConfiguration()) ?? {},
            "Active AI configuration.",
          ),
      }),
  },
  getUserAccountSummary: {
    description: "Read one user account summary. Admin only.",
    kinds: ["assistant"],
    scopes: ["ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Read one user account summary. Admin only.",
        inputSchema: userIdSchema,
        execute: async ({ userId }) => {
          const user = await context.db.user.findUnique({
            where: { id: userId },
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
  },
  getResumeSection: {
    description: "Load one resume section for resume copilot.",
    kinds: ["copilot"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Load one resume section for resume copilot.",
        inputSchema: z.object({
          resumeId: z.string().trim().min(1),
          target: ResumeSectionTargetSchema,
        }),
        execute: async ({ resumeId, target }) =>
          getResumeSectionSource(await getOwnedResume(context.db, context.userId ?? "", resumeId), target),
      }),
  },
  getResume: {
    description: "Load a compact owned resume overview for resume copilot.",
    kinds: ["copilot"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Load a compact owned resume overview for resume copilot.",
        inputSchema: resumeIdSchema,
        execute: async ({ resumeId }) =>
          buildResumeSnapshot(await getOwnedResume(context.db, context.userId ?? "", resumeId)),
      }),
  },
  analyzeJobDescription: {
    description: "Extract job priorities from a job description for resume copilot.",
    kinds: ["copilot"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: () =>
      tool({
        description: "Extract job priorities from a job description for resume copilot.",
        inputSchema: z.object({
          text: z.string().trim().min(20).max(12000),
        }),
        execute: async ({ text }) => analyzeJobDescriptionText(text),
      }),
  },
  matchResumeToJob: {
    description: "Compare an owned resume against a job description for resume copilot.",
    kinds: ["copilot"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Compare an owned resume against a job description for resume copilot.",
        inputSchema: z.object({
          resumeId: z.string().trim().min(1),
          jobDescription: z.string().trim().min(20).max(12000),
        }),
        execute: async ({ resumeId, jobDescription }) =>
          matchResumeSnapshotToJob(
            buildResumeSnapshot(await getOwnedResume(context.db, context.userId ?? "", resumeId)),
            analyzeJobDescriptionText(jobDescription),
          ),
      }),
  },
  prepareDraftSectionUpdate: {
    description: "Build a reviewable draft patch for a resume section.",
    kinds: ["copilot"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: () =>
      tool({
        description: "Build a reviewable draft patch for a resume section.",
        inputSchema: z.object({
          target: ResumeSectionTargetSchema,
          suggestedText: z.string().trim().min(1).max(4000),
        }),
        execute: async ({ target, suggestedText }) => buildDraftPatch(target as ResumeSectionTarget, suggestedText),
      }),
  },
  getOptimizationCredits: {
    description: "Read the remaining optimization credits for resume copilot.",
    kinds: ["copilot"],
    scopes: ["USER", "ADMIN"],
    requiresAuth: true,
    create: (context) =>
      tool({
        description: "Read the remaining optimization credits for resume copilot.",
        inputSchema: z.object({}),
        execute: async () => {
          const credits = await context.getOptimizationCredits();

          return {
            dailyLimit: credits?.dailyLimit ?? null,
            remainingCredits: credits?.remainingCredits ?? null,
          };
        },
      }),
  },
} as const satisfies Record<string, AiToolDescriptor>;

export type AiToolName = keyof typeof toolDefinitions;

export function createAiToolRegistry(context: AiToolContext) {
  function getTools(kind: AiToolKind): ToolSet {
    return Object.fromEntries(
      Object.entries(toolDefinitions)
        .filter(([, definition]) => canUseTool(definition, context, kind))
        .map(([name, definition]) => [name, definition.create(context)]),
    );
  }

  return {
    getAssistantTools() {
      return getTools("assistant");
    },
    getCopilotTools() {
      return getTools("copilot");
    },
    getPromptToolNames(kind: AiToolKind): string[] {
      return Object.entries(toolDefinitions)
        .filter(([, definition]) => canUseTool(definition, context, kind))
        .map(([name]) => name);
    },
  };
}

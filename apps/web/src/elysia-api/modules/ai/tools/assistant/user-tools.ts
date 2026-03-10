import { tool } from "@openrouter/sdk";
import { z } from "zod";
import { buildResumeSnapshot, compactText } from "../../utils";
import {
  clampLimit,
  createToolCollectionResult,
  createToolDetailResult,
  createToolMetricResult,
  getOwnedResume,
  limitSchema,
  resumeIdSchema,
  searchSchema,
} from "../shared";
import type { AssistantToolOptions } from "../types";

export function createUserAssistantTools(options: AssistantToolOptions) {
  const { db, userId, getOptimizationCredits, getCurrentModelSettings } = options;

  if (!userId) {
    return [] as const;
  }

  return [
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
}

import { tool } from "@openrouter/sdk";
import { ResumeSectionTargetSchema } from "@rezumerai/types";
import { z } from "zod";
import {
  analyzeJobDescriptionText,
  buildDraftPatch,
  buildResumeSnapshot,
  getResumeSectionSource,
  matchResumeSnapshotToJob,
} from "../../utils";
import { getOwnedResume, resumeIdSchema } from "../shared";
import type { CopilotToolOptions } from "../types";

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

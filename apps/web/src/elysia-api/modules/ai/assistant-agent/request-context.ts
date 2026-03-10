import { RequestContext } from "@mastra/core/request-context";
import { z } from "zod";
import type { AssistantAgentContext, AssistantAgentRunOptions } from "./types";

export const assistantRequestContextSchema = z.object({
  currentPath: z.string().max(200).optional(),
  db: z.any(),
  getAiConfiguration: z.any(),
  getCurrentModelSettings: z.any(),
  getOptimizationCredits: z.any(),
  latestUserMessage: z.string().min(1),
  modelId: z.string().min(1),
  requestedLimit: z.number().int().min(1).max(100).nullable(),
  resourceId: z.string().min(1),
  scope: z.enum(["PUBLIC", "USER", "ADMIN"]),
  systemPrompt: z.string().min(1),
  threadId: z.string().min(1),
  userId: z.string().nullable(),
});

export function buildRequestContext(options: AssistantAgentRunOptions, requestedLimit: number | null) {
  return new RequestContext<AssistantAgentContext>([
    ["currentPath", options.currentPath],
    ["db", options.db],
    ["getAiConfiguration", options.getAiConfiguration],
    ["getCurrentModelSettings", options.getCurrentModelSettings],
    ["getOptimizationCredits", options.getOptimizationCredits],
    ["latestUserMessage", options.latestUserMessage],
    ["modelId", options.modelId],
    ["requestedLimit", requestedLimit],
    ["resourceId", options.resourceId],
    ["scope", options.scope],
    ["systemPrompt", options.systemPrompt],
    ["threadId", options.threadId],
    ["userId", options.userId],
  ]);
}

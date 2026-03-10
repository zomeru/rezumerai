import { z } from "zod";

const IsoDatetimeStringSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}, z.string().datetime());

export const AiConfigurationSchema = z.object({
  PROMPT_VERSION: z.string().trim().min(1).max(100),
  DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: z.number().int().min(1).max(1000),
  OPTIMIZE_SYSTEM_PROMPT: z.string().trim().min(1).max(10000),
  COPILOT_SYSTEM_PROMPT: z.string().trim().min(1).max(6000),
  ASSISTANT_SYSTEM_PROMPT: z.string().trim().min(1).max(6000),
  ASSISTANT_MAX_STEPS: z.number().int().min(1).max(8),
  ASSISTANT_HISTORY_LIMIT: z.number().int().min(1).max(12),
  EMBEDDING_PROVIDER: z.string().trim().min(1).max(100),
  EMBEDDING_MODEL: z.string().trim().min(1).max(200),
  EMBEDDING_DIMENSIONS: z.number().int().min(1).max(3072),
  ASSISTANT_RAG_ENABLED: z.boolean(),
  ASSISTANT_RAG_TOP_K: z.number().int().min(1).max(12),
  ASSISTANT_RAG_RECENT_LIMIT: z.number().int().min(1).max(20),
  ASSISTANT_CONTEXT_TOKEN_LIMIT: z.number().int().min(128).max(16000),
});

const DEFAULT_ASSISTANT_SYSMTEM_PROMPT =
  "You are Rezumerai Assistant. Use approved tools for Rezumerai product or account data and never guess such information; if it cannot be retrieved, refuse briefly and safely. For general knowledge questions that do not require Rezumerai tools or private data, answer normally. Keep replies short, factual, and role-safe, prefer concise lists over long prose, and use real line breaks with section headers on their own lines and one list item per line.";

export const DEFAULT_AI_CONFIGURATION = {
  PROMPT_VERSION: "copilot-v1",
  DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 100,
  OPTIMIZE_SYSTEM_PROMPT:
    "Rewrite only the requested resume content. Keep facts unchanged. Never invent metrics, dates, employers, titles, skills, tools, or results. Return plain text only.",
  COPILOT_SYSTEM_PROMPT:
    "You are Resume Copilot. Use tools. Improve wording, targeting, and clarity without changing facts. If evidence is missing, say so. Never invent experience, metrics, dates, employers, titles, education, or technologies. Return compact JSON only.",
  ASSISTANT_SYSTEM_PROMPT: DEFAULT_ASSISTANT_SYSMTEM_PROMPT,
  ASSISTANT_MAX_STEPS: 4,
  ASSISTANT_HISTORY_LIMIT: 8,
  EMBEDDING_PROVIDER: "openrouter",
  EMBEDDING_MODEL: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
  EMBEDDING_DIMENSIONS: 2048,
  ASSISTANT_RAG_ENABLED: true,
  ASSISTANT_RAG_TOP_K: 4,
  ASSISTANT_RAG_RECENT_LIMIT: 8,
  ASSISTANT_CONTEXT_TOKEN_LIMIT: 1200,
} as const satisfies z.infer<typeof AiConfigurationSchema>;

export const AiModelOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  modelId: z.string(),
  providerName: z.string(),
  providerDisplayName: z.string(),
});

export const AiSettingsSchema = z.object({
  models: z.array(AiModelOptionSchema),
  selectedModelId: z.string(),
});

export const SelectAiModelInputSchema = z.object({
  modelId: z.string().trim().min(1),
});

export const AssistantRoleScopeSchema = z.enum(["PUBLIC", "USER", "ADMIN"]);

export const AssistantChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const AssistantChatInputSchema = z.object({
  messages: z.array(AssistantChatMessageSchema).min(1).max(12),
  currentPath: z.string().trim().max(200).optional(),
});

export const AssistantReplyParagraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  content: z.string().trim().min(1).max(4000),
});

export const AssistantReplyUnorderedListBlockSchema = z.object({
  type: z.literal("unordered-list"),
  items: z.array(z.string().trim().min(1).max(4000)).min(1).max(20),
});

export const AssistantReplyOrderedListBlockSchema = z.object({
  type: z.literal("ordered-list"),
  items: z.array(z.string().trim().min(1).max(4000)).min(1).max(20),
});

export const AssistantReplyBlockSchema = z.discriminatedUnion("type", [
  AssistantReplyParagraphBlockSchema,
  AssistantReplyUnorderedListBlockSchema,
  AssistantReplyOrderedListBlockSchema,
]);

export const AssistantChatResponseSchema = z.object({
  scope: AssistantRoleScopeSchema,
  reply: z.string().trim().min(1).max(4000),
  blocks: z.array(AssistantReplyBlockSchema).max(40),
  toolNames: z.array(z.string().trim().min(1).max(80)).max(20),
  usedConversationMemory: z.boolean(),
});

export const AssistantHistoryCursorSchema = z.object({
  createdAt: IsoDatetimeStringSchema,
  id: z.string().trim().min(1).max(100),
});

export const AssistantHistoryQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const AssistantHistoryMessageSchema = z.object({
  id: z.string().trim().min(1).max(100),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
  blocks: z.array(AssistantReplyBlockSchema).max(40).optional(),
  createdAt: IsoDatetimeStringSchema,
});

export const AssistantHistoryResponseSchema = z.object({
  scope: AssistantRoleScopeSchema,
  messages: z.array(AssistantHistoryMessageSchema).max(50),
  nextCursor: z.string().trim().min(1).nullable(),
  hasMore: z.boolean(),
});

export const ResumeSectionSchema = z.enum(["professionalSummary", "skills", "experience", "education", "project"]);

export const ResumeSectionTargetSchema = z.object({
  section: ResumeSectionSchema,
  itemId: z.string().trim().min(1).max(100).optional(),
});

export const ResumeCopilotIntentSchema = z.enum(["clarity", "impact", "ats", "concise", "grammar"]);

export const ResumeCopilotOptimizeInputSchema = z.object({
  resumeId: z.string().trim().min(1),
  target: ResumeSectionTargetSchema,
  intent: ResumeCopilotIntentSchema.default("clarity"),
});

export const ResumeCopilotSuggestionSchema = z.object({
  title: z.string().trim().min(1).max(140),
  rationale: z.string().trim().min(1).max(320),
  originalText: z.string().trim().min(1).max(4000),
  suggestedText: z.string().trim().min(1).max(4000),
  cautions: z.array(z.string().trim().min(1).max(220)).max(6),
  draftPatch: z.unknown(),
});

export const ResumeCopilotOptimizeResponseSchema = z.object({
  target: ResumeSectionTargetSchema,
  intent: ResumeCopilotIntentSchema,
  modelId: z.string(),
  creditsRemaining: z.number().int().min(0),
  suggestion: ResumeCopilotSuggestionSchema,
});

export const ResumeCopilotTailorInputSchema = z.object({
  resumeId: z.string().trim().min(1),
  jobDescription: z.string().trim().min(20).max(12000),
});

export const ResumeCopilotTailorSuggestionSchema = z.object({
  target: ResumeSectionTargetSchema,
  reason: z.string().trim().min(1).max(240),
  suggestion: z.string().trim().min(1).max(2400),
  draftPatch: z.unknown(),
  cautions: z.array(z.string().trim().min(1).max(220)).max(5),
});

export const ResumeCopilotTailorResponseSchema = z.object({
  modelId: z.string(),
  creditsRemaining: z.number().int().min(0),
  jobTitle: z.string().trim().max(200).nullable(),
  priorities: z.array(z.string().trim().min(1).max(140)).max(8),
  matches: z.array(z.string().trim().min(1).max(180)).max(8),
  gaps: z.array(z.string().trim().min(1).max(180)).max(8),
  suggestions: z.array(ResumeCopilotTailorSuggestionSchema).max(6),
});

export const ResumeCopilotReviewInputSchema = z.object({
  resumeId: z.string().trim().min(1),
  jobDescription: z.string().trim().max(12000).optional(),
});

export const ResumeCopilotReviewFindingSchema = z.object({
  severity: z.enum(["high", "medium", "low"]),
  section: z.string().trim().min(1).max(140),
  message: z.string().trim().min(1).max(240),
  fix: z.string().trim().min(1).max(240),
});

export const ResumeCopilotReviewResponseSchema = z.object({
  modelId: z.string(),
  creditsRemaining: z.number().int().min(0),
  overallScore: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(280),
  strengths: z.array(z.string().trim().min(1).max(180)).max(6),
  findings: z.array(ResumeCopilotReviewFindingSchema).max(10),
  nextSteps: z.array(z.string().trim().min(1).max(180)).max(6),
});

export type AiConfiguration = z.infer<typeof AiConfigurationSchema>;
export type AiModelOption = z.infer<typeof AiModelOptionSchema>;
export type AiSettings = z.infer<typeof AiSettingsSchema>;
export type SelectAiModelInput = z.infer<typeof SelectAiModelInputSchema>;
export type AssistantRoleScope = z.infer<typeof AssistantRoleScopeSchema>;
export type AssistantChatMessage = z.infer<typeof AssistantChatMessageSchema>;
export type AssistantChatInput = z.infer<typeof AssistantChatInputSchema>;
export type AssistantReplyParagraphBlock = z.infer<typeof AssistantReplyParagraphBlockSchema>;
export type AssistantReplyUnorderedListBlock = z.infer<typeof AssistantReplyUnorderedListBlockSchema>;
export type AssistantReplyOrderedListBlock = z.infer<typeof AssistantReplyOrderedListBlockSchema>;
export type AssistantReplyBlock = z.infer<typeof AssistantReplyBlockSchema>;
export type AssistantChatResponse = z.infer<typeof AssistantChatResponseSchema>;
export type AssistantHistoryCursor = z.infer<typeof AssistantHistoryCursorSchema>;
export type AssistantHistoryQuery = z.infer<typeof AssistantHistoryQuerySchema>;
export type AssistantHistoryMessage = z.infer<typeof AssistantHistoryMessageSchema>;
export type AssistantHistoryResponse = z.infer<typeof AssistantHistoryResponseSchema>;
export type ResumeSection = z.infer<typeof ResumeSectionSchema>;
export type ResumeSectionTarget = z.infer<typeof ResumeSectionTargetSchema>;
export type ResumeCopilotIntent = z.infer<typeof ResumeCopilotIntentSchema>;
export type ResumeCopilotOptimizeInput = z.infer<typeof ResumeCopilotOptimizeInputSchema>;
export type ResumeCopilotSuggestion = z.infer<typeof ResumeCopilotSuggestionSchema>;
export type ResumeCopilotOptimizeResponse = z.infer<typeof ResumeCopilotOptimizeResponseSchema>;
export type ResumeCopilotTailorInput = z.infer<typeof ResumeCopilotTailorInputSchema>;
export type ResumeCopilotTailorSuggestion = z.infer<typeof ResumeCopilotTailorSuggestionSchema>;
export type ResumeCopilotTailorResponse = z.infer<typeof ResumeCopilotTailorResponseSchema>;
export type ResumeCopilotReviewInput = z.infer<typeof ResumeCopilotReviewInputSchema>;
export type ResumeCopilotReviewFinding = z.infer<typeof ResumeCopilotReviewFindingSchema>;
export type ResumeCopilotReviewResponse = z.infer<typeof ResumeCopilotReviewResponseSchema>;

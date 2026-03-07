import type { Tool } from "@openrouter/sdk";
import type { Prisma, PrismaClient } from "@rezumerai/database";
import {
  type AiConfiguration,
  AiConfigurationSchema,
  type AssistantChatInput,
  type AssistantChatMessage,
  type AssistantChatResponseSchema,
  type AssistantRoleScope,
  DEFAULT_AI_CONFIGURATION,
  type ResumeCopilotOptimizeInput,
  type ResumeCopilotOptimizeResponse,
  ResumeCopilotOptimizeResponseSchema,
  type ResumeCopilotReviewInput,
  type ResumeCopilotReviewResponse,
  ResumeCopilotReviewResponseSchema,
  type ResumeCopilotTailorInput,
  type ResumeCopilotTailorResponse,
  ResumeCopilotTailorResponseSchema,
  type ResumeSectionTarget,
} from "@rezumerai/types";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import { serverEnv } from "@/env";
import { getPublicAppContent, searchPublicFaq } from "@/lib/system-content";
import {
  AI_CREDITS_EXHAUSTED_CODE,
  AI_MODEL_POLICY_RESTRICTED_CODE,
  AI_MODEL_UNAVAILABLE_CODE,
  aiConfigurationName,
  asiaManilaUtcOffsetMs,
  DEFAULT_AI_SETTINGS,
  openRouterProviderName,
} from "./constants";
import { createAssistantTools } from "./tools";
import {
  analyzeJobDescriptionText,
  buildDraftPatch,
  buildResumeSnapshot,
  compactText,
  formatAssistantReply,
  getResumeSectionSource,
  matchResumeSnapshotToJob,
  parseAssistantReplyBlocks,
  parseJsonResponse,
  toJsonText,
} from "./utils";

type OpenRouterModule = typeof import("@openrouter/sdk");

interface OpenRouterRuntime {
  client: InstanceType<OpenRouterModule["OpenRouter"]>;
  stepCountIs: OpenRouterModule["stepCountIs"];
}

let openRouterRuntimePromise: Promise<OpenRouterRuntime> | null = null;

async function getOpenRouterRuntime(): Promise<OpenRouterRuntime> {
  if (!openRouterRuntimePromise) {
    openRouterRuntimePromise = import("@openrouter/sdk").then(({ OpenRouter, stepCountIs }) => ({
      client: new OpenRouter({
        apiKey: serverEnv?.OPENROUTER_API_KEY,
      }),
      stepCountIs,
    }));
  }

  return openRouterRuntimePromise;
}

const optimizeModelSchema = z.object({
  title: z.string().trim().min(1).max(140),
  rationale: z.string().trim().min(1).max(320),
  suggestedText: z.string().trim().min(1).max(4000),
  cautions: z.array(z.string().trim().min(1).max(220)).max(6).default([]),
  draftPatch: z.unknown().optional(),
});

const tailorModelSchema = z.object({
  jobTitle: z.string().trim().max(200).nullable().default(null),
  priorities: z.array(z.string().trim().min(1).max(140)).max(8).default([]),
  matches: z.array(z.string().trim().min(1).max(180)).max(8).default([]),
  gaps: z.array(z.string().trim().min(1).max(180)).max(8).default([]),
  suggestions: z
    .array(
      z.object({
        target: z.object({
          section: z.enum(["professionalSummary", "skills", "experience", "education", "project"]),
          itemId: z.string().trim().min(1).max(100).optional(),
        }),
        reason: z.string().trim().min(1).max(240),
        suggestion: z.string().trim().min(1).max(2400),
        cautions: z.array(z.string().trim().min(1).max(220)).max(5).default([]),
        draftPatch: z.unknown().optional(),
      }),
    )
    .max(6)
    .default([]),
});

const reviewModelSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(280),
  strengths: z.array(z.string().trim().min(1).max(180)).max(6).default([]),
  findings: z
    .array(
      z.object({
        severity: z.enum(["high", "medium", "low"]),
        section: z.string().trim().min(1).max(140),
        message: z.string().trim().min(1).max(240),
        fix: z.string().trim().min(1).max(240),
      }),
    )
    .max(10)
    .default([]),
  nextSteps: z.array(z.string().trim().min(1).max(180)).max(6).default([]),
});

export interface AiUsageMetrics {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  reasoningTokens: number | null;
}

export interface StreamOptimizeTextOptions {
  onUsage?: (usage: AiUsageMetrics) => void;
}

export interface SaveOptimizationInput {
  userId: string;
  provider: string;
  model: string;
  promptVersion: string;
  resumeId?: string | null;
  inputText: string;
  optimizedText: string;
  status: "success" | "failed" | "aborted";
  durationMs: number;
  chunkCount: number;
  errorMessage?: string | null;
  usage: AiUsageMetrics;
}

export interface ConsumeDailyCreditResult {
  remainingCredits: number;
}

export interface DailyCreditsStatus {
  remainingCredits: number;
  dailyLimit: number;
}

export interface ActiveAiModel {
  id: string;
  name: string;
  modelId: string;
  providerName: string;
  providerDisplayName: string;
}

export interface UserAiSettings {
  models: ActiveAiModel[];
  selectedModelId: string;
}

interface OptimizationContext {
  model: ActiveAiModel;
  config: AiConfiguration;
}

interface StructuredModelResult<T> {
  data: T;
  usage: AiUsageMetrics;
  toolNames: string[];
}

interface TextModelResult {
  text: string;
  usage: AiUsageMetrics;
  toolNames: string[];
}

interface CopilotRunResult<T> {
  response: T;
  usage: AiUsageMetrics;
  promptVersion: string;
}

export class AiCreditsExhaustedError extends Error {
  readonly code: string = AI_CREDITS_EXHAUSTED_CODE;

  constructor() {
    super(ERROR_MESSAGES.AI_CREDITS_EXHAUSTED);
    this.name = "AiCreditsExhaustedError";
  }
}

export class AiModelUnavailableError extends Error {
  readonly code: string = AI_MODEL_UNAVAILABLE_CODE;

  constructor(message = ERROR_MESSAGES.AI_MODEL_UNAVAILABLE) {
    super(message);
    this.name = "AiModelUnavailableError";
  }
}

export class AiModelPolicyRestrictedError extends Error {
  readonly code: string = AI_MODEL_POLICY_RESTRICTED_CODE;

  constructor() {
    super(ERROR_MESSAGES.AI_MODEL_POLICY_RESTRICTED);
    this.name = "AiModelPolicyRestrictedError";
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: Elysia module service keeps related runtime helpers together.
export abstract class AiService {
  static readonly DEFAULT_CONFIGURATION = DEFAULT_AI_SETTINGS;

  static emptyUsageMetrics(): AiUsageMetrics {
    return {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      reasoningTokens: null,
    };
  }

  static async listActiveModels(db: PrismaClient): Promise<ActiveAiModel[]> {
    const models = await db.aiModel.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        modelId: true,
        provider: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ provider: { name: "asc" } }, { name: "asc" }],
    });

    return models.map((model) => ({
      id: model.id,
      name: model.name,
      modelId: model.modelId,
      providerName: model.provider.name,
      providerDisplayName: AiService.formatProviderName(model.provider.name),
    }));
  }

  static async getAiConfiguration(db: PrismaClient): Promise<AiConfiguration> {
    const configuration = await db.systemConfiguration.findUnique({
      where: { name: aiConfigurationName },
      select: { value: true },
    });

    if (!configuration) {
      return DEFAULT_AI_CONFIGURATION;
    }

    return AiService.parseAiConfiguration(configuration.value);
  }

  static async getUserAiSettings(db: PrismaClient, userId: string): Promise<UserAiSettings> {
    const [models, user] = await Promise.all([
      AiService.listActiveModels(db),
      db.user.findUnique({
        where: { id: userId },
        select: {
          selectedAiModelId: true,
        },
      }),
    ]);

    if (!user) {
      throw new Error(ERROR_MESSAGES.AI_USER_NOT_FOUND);
    }

    const selectedModel =
      models.length > 0 ? AiService.resolveSelectedModel(models, user.selectedAiModelId ?? null, null) : null;

    return {
      models,
      selectedModelId: selectedModel?.modelId ?? "",
    };
  }

  static async updateUserSelectedModel(db: PrismaClient, userId: string, modelId: string): Promise<string> {
    const models = await AiService.listActiveModels(db);
    const selectedModel = models.find((model) => model.modelId === modelId);

    if (!selectedModel) {
      throw new AiModelUnavailableError();
    }

    await db.user.update({
      where: { id: userId },
      data: {
        selectedAiModelId: selectedModel.id,
      },
    });

    return selectedModel.modelId;
  }

  static async resolveOptimizationContext(
    db: PrismaClient,
    userId: string | null,
    requestedModelId?: string | null,
  ): Promise<OptimizationContext> {
    const [models, config, user] = await Promise.all([
      AiService.listActiveModels(db),
      AiService.getAiConfiguration(db),
      userId
        ? db.user.findUnique({
            where: { id: userId },
            select: {
              selectedAiModelId: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (userId && !user) {
      throw new Error(ERROR_MESSAGES.AI_USER_NOT_FOUND);
    }

    const model = AiService.resolveSelectedModel(models, user?.selectedAiModelId ?? null, requestedModelId ?? null);

    return {
      model,
      config,
    };
  }

  static async consumeDailyCredit(
    db: PrismaClient,
    userId: string,
    dailyLimit: number,
    now: Date = new Date(),
  ): Promise<ConsumeDailyCreditResult> {
    const todayBoundary = AiService.getAsiaManilaMidnightBoundary(now);

    return db.$transaction(async (tx) => {
      await AiService.ensureDailyCreditsWindow(tx, userId, todayBoundary, dailyLimit);

      const consumeResult = await tx.aiTextOptimizerCredits.updateMany({
        where: {
          userId,
          credits: {
            gt: 0,
          },
        },
        data: {
          credits: {
            decrement: 1,
          },
        },
      });

      if (consumeResult.count === 0) {
        throw new AiCreditsExhaustedError();
      }

      const creditsRecord = await tx.aiTextOptimizerCredits.findUnique({
        where: { userId },
        select: { credits: true },
      });

      return { remainingCredits: creditsRecord?.credits ?? 0 };
    });
  }

  static async getDailyCredits(db: PrismaClient, userId: string, now: Date = new Date()): Promise<DailyCreditsStatus> {
    const config = await AiService.getAiConfiguration(db);
    const dailyLimit = config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT;
    const todayBoundary = AiService.getAsiaManilaMidnightBoundary(now);

    return db.$transaction(async (tx) => {
      await AiService.ensureDailyCreditsWindow(tx, userId, todayBoundary, dailyLimit);

      const creditsRecord = await tx.aiTextOptimizerCredits.findUnique({
        where: { userId },
        select: { credits: true },
      });

      return {
        remainingCredits: creditsRecord?.credits ?? dailyLimit,
        dailyLimit,
      };
    });
  }

  static toAssistantScope(role: string | null | undefined): AssistantRoleScope {
    if (role === "ADMIN") {
      return "ADMIN";
    }

    if (role === "USER") {
      return "USER";
    }

    return "PUBLIC";
  }

  static async runAssistantChat(
    db: PrismaClient,
    input: AssistantChatInput,
    identity: { userId: string | null; role: "ADMIN" | "USER" | null },
  ): Promise<z.infer<typeof AssistantChatResponseSchema>> {
    const scope = AiService.toAssistantScope(identity.role);
    const runtime = await AiService.resolveOptimizationContext(db, identity.userId, null);
    const history = input.messages.slice(-runtime.config.ASSISTANT_HISTORY_LIMIT).map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const messages = input.currentPath
      ? [...history, { role: "user" as const, content: `Page: ${input.currentPath}` }]
      : history;
    const tools = createAssistantTools({
      db,
      scope,
      userId: identity.userId,
      role: identity.role,
      getOptimizationCredits: async () => (identity.userId ? AiService.getDailyCredits(db, identity.userId) : null),
      getCurrentModelSettings: async () => {
        if (!identity.userId) {
          return null;
        }

        const settings = await AiService.getUserAiSettings(db, identity.userId);
        return {
          selectedModelId: settings.selectedModelId,
          models: settings.models.map((item) => item.modelId),
        };
      },
    });

    const result = await AiService.runTextModel({
      modelId: runtime.model.modelId,
      instructions:
        `${runtime.config.ASSISTANT_SYSTEM_PROMPT} ` +
        `Scope=${scope}. Use tools when needed. Keep the reply short. ` +
        "Format replies as: short intro line, blank line, optional `**Section:**` headers on their own lines, list items one per line, blank line, short closing line if needed.",
      input: messages,
      tools,
      maxSteps: runtime.config.ASSISTANT_MAX_STEPS,
    });

    const latestUserMessage = [...input.messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const reply =
      scope === "PUBLIC" && result.toolNames.length === 0
        ? await AiService.buildPublicAssistantFallback(db, latestUserMessage)
        : formatAssistantReply(result.text, 4000);
    const blocks = parseAssistantReplyBlocks(reply);

    return {
      scope,
      reply,
      blocks,
      toolNames: result.toolNames,
    };
  }

  static async runCopilotOptimize(
    db: PrismaClient,
    userId: string,
    input: ResumeCopilotOptimizeInput,
  ): Promise<CopilotRunResult<ResumeCopilotOptimizeResponse>> {
    const runtime = await AiService.resolveOptimizationContext(db, userId, null);
    const credit = await AiService.consumeDailyCredit(db, userId, runtime.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT);
    const resume = await AiService.getOwnedResume(db, userId, input.resumeId);
    const sectionSource = getResumeSectionSource(resume, input.target);
    const snapshot = buildResumeSnapshot(resume);

    const result = await AiService.runStructuredModel({
      modelId: runtime.model.modelId,
      instructions:
        `${runtime.config.COPILOT_SYSTEM_PROMPT} ` +
        "Task=optimize. Rewrite only the requested section. Keep facts unchanged. " +
        "Return JSON with title, rationale, suggestedText, cautions, draftPatch.",
      input: [
        {
          role: "user",
          content: toJsonText({
            resumeId: input.resumeId,
            intent: input.intent,
            resume: {
              headline: snapshot.headline,
              summary: snapshot.summary,
              skills: snapshot.skills.slice(0, 12),
            },
            target: {
              ...sectionSource,
              originalText: compactText(sectionSource.originalText, 2000),
            },
          }),
        },
      ],
      tools: [],
      schema: optimizeModelSchema,
      maxSteps: 1,
    });

    return {
      response: ResumeCopilotOptimizeResponseSchema.parse({
        target: input.target,
        intent: input.intent,
        modelId: runtime.model.modelId,
        creditsRemaining: credit.remainingCredits,
        suggestion: {
          title: result.data.title,
          rationale: result.data.rationale,
          originalText: sectionSource.originalText,
          suggestedText: result.data.suggestedText,
          cautions: result.data.cautions,
          draftPatch: result.data.draftPatch ?? buildDraftPatch(input.target, result.data.suggestedText),
        },
      }),
      usage: result.usage,
      promptVersion: runtime.config.PROMPT_VERSION,
    };
  }

  static async runCopilotTailor(
    db: PrismaClient,
    userId: string,
    input: ResumeCopilotTailorInput,
  ): Promise<CopilotRunResult<ResumeCopilotTailorResponse>> {
    const runtime = await AiService.resolveOptimizationContext(db, userId, null);
    const credit = await AiService.consumeDailyCredit(db, userId, runtime.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT);
    const resume = await AiService.getOwnedResume(db, userId, input.resumeId);
    const snapshot = buildResumeSnapshot(resume);
    const analysis = analyzeJobDescriptionText(input.jobDescription);
    const comparison = matchResumeSnapshotToJob(snapshot, analysis);
    const allowedTargets = AiService.buildCopilotTargets(resume);

    const result = await AiService.runStructuredModel({
      modelId: runtime.model.modelId,
      instructions:
        `${runtime.config.COPILOT_SYSTEM_PROMPT} ` +
        "Task=tailor. Suggest only truthful emphasis changes based on the provided resume and job analysis. " +
        "Only suggest truthful emphasis changes. Return compact JSON with jobTitle, priorities, matches, gaps, suggestions.",
      input: [
        {
          role: "user",
          content: toJsonText({
            resumeId: input.resumeId,
            resume: snapshot,
            job: {
              description: compactText(input.jobDescription, 4000),
              analysis,
              comparison,
            },
            allowedTargets,
          }),
        },
      ],
      tools: [],
      schema: tailorModelSchema,
      maxSteps: 1,
    });

    return {
      response: ResumeCopilotTailorResponseSchema.parse({
        modelId: runtime.model.modelId,
        creditsRemaining: credit.remainingCredits,
        jobTitle: result.data.jobTitle,
        priorities: result.data.priorities,
        matches: result.data.matches,
        gaps: result.data.gaps,
        suggestions: result.data.suggestions.map((item) => ({
          ...item,
          draftPatch: item.draftPatch ?? buildDraftPatch(item.target as ResumeSectionTarget, item.suggestion),
        })),
      }),
      usage: result.usage,
      promptVersion: runtime.config.PROMPT_VERSION,
    };
  }

  static async runCopilotReview(
    db: PrismaClient,
    userId: string,
    input: ResumeCopilotReviewInput,
  ): Promise<CopilotRunResult<ResumeCopilotReviewResponse>> {
    const runtime = await AiService.resolveOptimizationContext(db, userId, null);
    const credit = await AiService.consumeDailyCredit(db, userId, runtime.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT);
    const resume = await AiService.getOwnedResume(db, userId, input.resumeId);
    const snapshot = buildResumeSnapshot(resume);
    const analysis = input.jobDescription ? analyzeJobDescriptionText(input.jobDescription) : null;
    const comparison = analysis ? matchResumeSnapshotToJob(snapshot, analysis) : null;

    const result = await AiService.runStructuredModel({
      modelId: runtime.model.modelId,
      instructions:
        `${runtime.config.COPILOT_SYSTEM_PROMPT} ` +
        "Task=review. Review the resume for clarity, completeness, and safe resume quality. " +
        "Return JSON with overallScore, summary, strengths, findings, nextSteps.",
      input: [
        {
          role: "user",
          content: toJsonText({
            resumeId: input.resumeId,
            resume: snapshot,
            job: input.jobDescription
              ? {
                  description: compactText(input.jobDescription, 4000),
                  analysis,
                  comparison,
                }
              : null,
          }),
        },
      ],
      tools: [],
      schema: reviewModelSchema,
      maxSteps: 1,
    });

    return {
      response: ResumeCopilotReviewResponseSchema.parse({
        modelId: runtime.model.modelId,
        creditsRemaining: credit.remainingCredits,
        overallScore: result.data.overallScore,
        summary: result.data.summary,
        strengths: result.data.strengths,
        findings: result.data.findings,
        nextSteps: result.data.nextSteps,
      }),
      usage: result.usage,
      promptVersion: runtime.config.PROMPT_VERSION,
    };
  }

  static async *streamOptimizeText(
    stream: AsyncIterable<unknown>,
    options?: StreamOptimizeTextOptions,
  ): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream as AsyncIterable<{
      choices?: Array<{ delta?: { content?: string | null } }>;
      usage?: {
        promptTokens?: number | null;
        completionTokens?: number | null;
        totalTokens?: number | null;
        completionTokensDetails?: { reasoningTokens?: number | null };
      };
    }>) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }

      if (chunk.usage) {
        options?.onUsage?.({
          promptTokens: chunk.usage.promptTokens ?? null,
          completionTokens: chunk.usage.completionTokens ?? null,
          totalTokens: chunk.usage.totalTokens ?? null,
          reasoningTokens: chunk.usage.completionTokensDetails?.reasoningTokens ?? null,
        });
      }
    }
  }

  static async createOptimizeStream(
    input: string,
    modelId: string,
    systemPrompt: string,
  ): Promise<AsyncIterable<unknown>> {
    const { client } = await getOpenRouterRuntime();

    return client.chat.send({
      chatGenerationParams: {
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
        stream: true,
      },
    });
  }

  static normalizeOptimizationError(error: unknown): Error {
    const message = AiService.getErrorMessage(error);
    const statusCode = AiService.getErrorStatusCode(error);
    const normalizedMessage = message.length > 0 ? message : ERROR_MESSAGES.AI_UNKNOWN_OPTIMIZATION_ERROR;
    const isPolicyError = statusCode === 404 && normalizedMessage.toLowerCase().includes("data policy");

    if (isPolicyError) {
      return new AiModelPolicyRestrictedError();
    }

    return new Error(normalizedMessage);
  }

  static async saveOptimization(db: PrismaClient, payload: SaveOptimizationInput): Promise<void> {
    const inputText = payload.inputText.trim();
    const optimizedText = payload.optimizedText.trim();

    const linkedResumeId = await AiService.resolveOwnedResumeId(db, payload.userId, payload.resumeId ?? null);

    await db.aiOptimization.create({
      data: {
        userId: payload.userId,
        resumeId: linkedResumeId,
        inputText,
        optimizedText,
        provider: payload.provider,
        model: payload.model,
        promptVersion: payload.promptVersion,
        status: payload.status,
        inputCharCount: inputText.length,
        outputCharCount: optimizedText.length,
        chunkCount: payload.chunkCount,
        durationMs: payload.durationMs,
        promptTokens: payload.usage.promptTokens,
        completionTokens: payload.usage.completionTokens,
        totalTokens: payload.usage.totalTokens,
        reasoningTokens: payload.usage.reasoningTokens,
        errorMessage: payload.errorMessage ?? null,
      },
    });
  }

  static async saveCopilotResult(
    db: PrismaClient,
    userId: string,
    resumeId: string,
    operation: "optimize" | "tailor" | "review",
    modelId: string,
    promptVersion: string,
    payload: unknown,
    response: unknown,
    usage: AiUsageMetrics,
    durationMs: number,
  ): Promise<void> {
    await AiService.saveOptimization(db, {
      userId,
      resumeId,
      provider: openRouterProviderName,
      model: modelId,
      promptVersion: `${promptVersion}:${operation}`,
      inputText: toJsonText(payload),
      optimizedText: toJsonText(response),
      status: "success",
      durationMs,
      chunkCount: 0,
      usage,
    });
  }

  static async saveCopilotFailure(
    db: PrismaClient,
    userId: string,
    resumeId: string,
    operation: "optimize" | "tailor" | "review",
    modelId: string,
    promptVersion: string,
    payload: unknown,
    errorMessage: string,
    durationMs: number,
  ): Promise<void> {
    await AiService.saveOptimization(db, {
      userId,
      resumeId,
      provider: openRouterProviderName,
      model: modelId,
      promptVersion: `${promptVersion}:${operation}`,
      inputText: toJsonText(payload),
      optimizedText: "",
      status: "failed",
      durationMs,
      chunkCount: 0,
      errorMessage,
      usage: AiService.emptyUsageMetrics(),
    });
  }

  private static async runStructuredModel<T extends Record<string, unknown>>(options: {
    modelId: string;
    instructions: string;
    input: AssistantChatMessage[] | Array<{ role: "user" | "assistant"; content: string }>;
    tools: readonly Tool[];
    schema: z.ZodType<T> & z.ZodObject<z.ZodRawShape>;
    maxSteps: number;
  }): Promise<StructuredModelResult<T>> {
    const { client } = await getOpenRouterRuntime();
    const response = await client.chat.send({
      chatGenerationParams: {
        model: options.modelId,
        messages: [
          { role: "system", content: options.instructions },
          ...options.input.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            name: "resume_copilot_response",
            schema: z.toJSONSchema(options.schema),
            strict: true,
          },
        },
      },
    });
    const messageContent = response.choices[0]?.message?.content;
    const text = typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent ?? {});
    const structuredData = parseJsonResponse(text, options.schema);

    return {
      data: structuredData,
      usage: {
        promptTokens: response.usage?.promptTokens ?? null,
        completionTokens: response.usage?.completionTokens ?? null,
        totalTokens: response.usage?.totalTokens ?? null,
        reasoningTokens: response.usage?.completionTokensDetails?.reasoningTokens ?? null,
      },
      toolNames: [],
    };
  }

  private static async runTextModel(options: {
    modelId: string;
    instructions: string;
    input: AssistantChatMessage[] | Array<{ role: "user" | "assistant"; content: string }>;
    tools: readonly Tool[];
    maxSteps: number;
  }): Promise<TextModelResult> {
    const { client, stepCountIs } = await getOpenRouterRuntime();
    const result = client.callModel({
      model: options.modelId,
      instructions: options.instructions,
      input: options.input,
      tools: options.tools,
      stopWhen: stepCountIs(options.maxSteps),
    });

    const [text, response, toolCalls] = await Promise.all([
      result.getText(),
      result.getResponse(),
      result.getToolCalls(),
    ]);

    return {
      text: text.trim() || ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
      usage: {
        promptTokens: response.usage?.inputTokens ?? null,
        completionTokens: response.usage?.outputTokens ?? null,
        totalTokens:
          response.usage &&
          typeof response.usage.inputTokens === "number" &&
          typeof response.usage.outputTokens === "number"
            ? response.usage.inputTokens + response.usage.outputTokens
            : null,
        reasoningTokens: response.usage?.outputTokensDetails?.reasoningTokens ?? null,
      },
      toolNames: toolCalls.map((toolCall) => toolCall.name),
    };
  }

  private static async getOwnedResume(db: PrismaClient, userId: string, resumeId: string) {
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

  private static buildCopilotTargets(resume: Awaited<ReturnType<typeof AiService.getOwnedResume>>) {
    const targets: ResumeSectionTarget[] = [
      { section: "professionalSummary" },
      { section: "skills" },
      ...resume.experience.map((item) => ({ section: "experience" as const, itemId: item.id })),
      ...resume.education.map((item) => ({ section: "education" as const, itemId: item.id })),
      ...resume.project.map((item) => ({ section: "project" as const, itemId: item.id })),
    ];

    return targets.map((target) => {
      const source = getResumeSectionSource(resume, target);

      return {
        target,
        label: source.itemLabel ? `${source.label}: ${source.itemLabel}` : source.label,
        currentText: compactText(source.originalText, 500),
      };
    });
  }

  private static async buildPublicAssistantFallback(db: PrismaClient, query: string): Promise<string> {
    const [landing, faqMatches] = await Promise.all([getPublicAppContent("landing", db), searchPublicFaq(query, db)]);

    if (faqMatches.length > 0) {
      return compactText(
        faqMatches
          .slice(0, 2)
          .map((item) => `${item.question} ${item.answer}`)
          .join(" "),
        4000,
      );
    }

    return compactText(`${landing.title}. ${landing.summary}`, 4000);
  }

  private static async resolveOwnedResumeId(
    db: PrismaClient,
    userId: string,
    resumeId: string | null,
  ): Promise<string | null> {
    if (!resumeId) {
      return null;
    }

    const ownedResume = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });

    return ownedResume?.id ?? null;
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message.trim();
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.trim().length > 0
    ) {
      return error.message.trim();
    }

    return "";
  }

  private static getErrorStatusCode(error: unknown): number | null {
    if (typeof error !== "object" || error === null || !("statusCode" in error)) {
      return null;
    }

    return typeof error.statusCode === "number" ? error.statusCode : null;
  }

  private static parseAiConfiguration(value: Prisma.JsonValue): AiConfiguration {
    const parsedConfiguration = AiConfigurationSchema.safeParse(value);

    if (!parsedConfiguration.success) {
      return DEFAULT_AI_CONFIGURATION;
    }

    return parsedConfiguration.data;
  }

  private static resolveSelectedModel(
    models: ActiveAiModel[],
    selectedModelDbId: string | null,
    requestedModelId: string | null,
  ): ActiveAiModel {
    if (models.length === 0) {
      throw new AiModelUnavailableError(ERROR_MESSAGES.AI_NO_ACTIVE_MODELS);
    }

    if (requestedModelId) {
      const requestedModel = models.find((model) => model.modelId === requestedModelId);
      if (!requestedModel) {
        throw new AiModelUnavailableError();
      }
      return requestedModel;
    }

    if (selectedModelDbId) {
      const savedModel = models.find((model) => model.id === selectedModelDbId);
      if (savedModel) {
        return savedModel;
      }
    }

    return models[0] as ActiveAiModel;
  }

  private static formatProviderName(providerName: string): string {
    return providerName
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
      .join(" ");
  }

  private static getAsiaManilaMidnightBoundary(date: Date): Date {
    const manilaDate = new Date(date.getTime() + asiaManilaUtcOffsetMs);
    manilaDate.setUTCHours(0, 0, 0, 0);

    return new Date(manilaDate.getTime() - asiaManilaUtcOffsetMs);
  }

  private static async ensureDailyCreditsWindow(
    db: Pick<PrismaClient, "aiTextOptimizerCredits">,
    userId: string,
    todayBoundary: Date,
    dailyLimit: number,
  ): Promise<void> {
    await db.aiTextOptimizerCredits.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        credits: dailyLimit,
        lastResetAt: todayBoundary,
      },
    });

    await db.aiTextOptimizerCredits.updateMany({
      where: {
        userId,
        lastResetAt: {
          lt: todayBoundary,
        },
      },
      data: {
        credits: dailyLimit,
        lastResetAt: todayBoundary,
      },
    });
  }
}

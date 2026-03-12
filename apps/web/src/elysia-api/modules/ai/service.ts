import type { Prisma, PrismaClient } from "@rezumerai/database";
import type {
  AiConfiguration,
  AssistantHistoryQuery,
  AssistantRoleScope,
  ResumeCopilotOptimizeInput,
  ResumeCopilotOptimizeResponse,
  ResumeCopilotReviewInput,
  ResumeCopilotReviewResponse,
  ResumeCopilotTailorInput,
  ResumeCopilotTailorResponse,
  ResumeSectionTarget,
} from "@rezumerai/types";
import {
  AiConfigurationSchema,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_CONFIGURATION as DEFAULT_CONFIGURATION_VALUE,
  ResumeCopilotOptimizeResponseSchema,
  ResumeCopilotReviewResponseSchema,
  ResumeCopilotTailorResponseSchema,
  ResumeSectionTargetSchema,
} from "@rezumerai/types";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  Output,
  stepCountIs,
  streamText,
  type ToolSet,
} from "ai";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import {
  buildAssistantThreadCursor,
  buildDeterministicConversationReply,
  isConversationMemoryIntent,
  parseAssistantThreadCursor,
  resolveAssistantScope,
} from "./assistant-chat";
import { DEFAULT_AI_SETTINGS, openRouterProviderName } from "./constants";
import { auditAdminAssistantUsage } from "./controller/helpers/audit";
import { AiCreditsExhaustedError, AiModelPolicyRestrictedError, AiModelUnavailableError } from "./errors";
import { emptyAiUsageMetrics, mapOpenRouterModelToActiveAiModel } from "./mapper";
import { ConversationMemoryService } from "./memory/service";
import { getAvailableModels as fetchOpenRouterModels } from "./openrouter-model-service";
import { composeAiSystemPrompt } from "./prompts/composer";
import { createAiProviderRegistry } from "./providers/registry";
import { AiRepository } from "./repository";
import { createAiToolRegistry } from "./tools/registry";
import type {
  ActiveAiModel,
  AiUsageMetrics,
  AssistantConversationIdentity,
  CopilotRunResult,
  DailyCreditsStatus,
  OptimizationContext,
  SaveOptimizationInput,
  StreamOptimizeTextOptions,
  StructuredModelResult,
  UserAiSettings,
} from "./types";
import {
  type AssistantUiMessage,
  collectToolNamesFromUiMessageParts,
  extractTextFromUiMessageParts,
} from "./ui-message";
import {
  analyzeJobDescriptionText,
  buildDraftPatch,
  buildResumeSnapshot,
  compactText,
  getResumeSectionSource,
  matchResumeSnapshotToJob,
  toJsonText,
} from "./utils";

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

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;
type StreamTextHandle = ReturnType<typeof streamText>;

export { AiCreditsExhaustedError, AiModelPolicyRestrictedError, AiModelUnavailableError };
export type {
  ActiveAiModel,
  AiUsageMetrics,
  AssistantConversationIdentity,
  CopilotRunResult,
  DailyCreditsStatus,
  OptimizationContext,
  SaveOptimizationInput,
  StreamOptimizeTextOptions,
  UserAiSettings,
} from "./types";

function toUsageMetrics(usage: {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  totalTokens?: number | undefined;
  outputTokenDetails?: {
    reasoningTokens?: number | undefined;
  };
}): AiUsageMetrics {
  return {
    promptTokens: usage.inputTokens ?? null,
    completionTokens: usage.outputTokens ?? null,
    totalTokens: usage.totalTokens ?? null,
    reasoningTokens: usage.outputTokenDetails?.reasoningTokens ?? null,
  };
}

function dedupeToolNames(toolNames: string[]): string[] {
  return [...new Set(toolNames)];
}

function buildCopilotScope(role: AssistantConversationIdentity["role"]): AssistantRoleScope {
  return role === "ADMIN" ? "ADMIN" : "USER";
}

function toAssistantChatHistory(
  messages: AssistantUiMessage[],
): Array<{ content: string; role: "assistant" | "user" }> {
  return messages.flatMap((message) => {
    if (message.role !== "assistant" && message.role !== "user") {
      return [];
    }

    const content = extractTextFromUiMessageParts(message.parts);

    if (!content) {
      return [];
    }

    return [
      {
        role: message.role,
        content,
      },
    ];
  });
}

// biome-ignore lint/complexity/noStaticOnlyClass: The AI service is the module-level facade for orchestration and persistence.
export abstract class AiService {
  static readonly DEFAULT_CONFIGURATION = DEFAULT_AI_SETTINGS;

  static emptyUsageMetrics(): AiUsageMetrics {
    return emptyAiUsageMetrics();
  }

  static async getAvailableModels(): Promise<ActiveAiModel[]> {
    const models = await fetchOpenRouterModels();
    return models.map(mapOpenRouterModelToActiveAiModel);
  }

  static async getAiConfiguration(db: DatabaseClient): Promise<AiConfiguration> {
    const configurationValue = await AiRepository.getAiConfigurationValue(db);

    if (!configurationValue) {
      return DEFAULT_CONFIGURATION_VALUE;
    }

    return AiService.parseAiConfiguration(configurationValue);
  }

  static async getUserAiSettings(db: DatabaseClient, userId: string): Promise<UserAiSettings> {
    const [models, user] = await Promise.all([
      AiService.getAvailableModels(),
      AiRepository.getUserSelectedModelRecord(db, userId),
    ]);

    if (!user) {
      throw new Error(ERROR_MESSAGES.AI_USER_NOT_FOUND);
    }

    const savedModelId = user.selectedAiModel;
    const selectedModelId = models.some((m) => m.id === savedModelId) ? savedModelId : DEFAULT_AI_MODEL;

    return { models, selectedModelId };
  }

  static async updateUserSelectedModel(db: DatabaseClient, userId: string, modelId: string): Promise<string> {
    const models = await AiService.getAvailableModels();

    if (!models.some((m) => m.id === modelId)) {
      throw new AiModelUnavailableError();
    }

    await AiRepository.updateUserSelectedModel(db, userId, modelId);
    return modelId;
  }

  static async resolveOptimizationContext(
    db: DatabaseClient,
    userId: string | null,
    requestedModelId?: string | null,
  ): Promise<OptimizationContext> {
    const [models, config, user] = await Promise.all([
      AiService.getAvailableModels(),
      AiService.getAiConfiguration(db),
      userId ? AiRepository.getUserSelectedModelRecord(db, userId) : Promise.resolve(null),
    ]);

    if (userId && !user) {
      throw new Error(ERROR_MESSAGES.AI_USER_NOT_FOUND);
    }

    const savedModelId = user?.selectedAiModel ?? DEFAULT_AI_MODEL;
    const effectiveId = AiService.resolveModelId(models, savedModelId, requestedModelId ?? null);
    const model = models.find((m) => m.id === effectiveId);

    if (!model) {
      throw new AiModelUnavailableError(ERROR_MESSAGES.AI_NO_ACTIVE_MODELS);
    }

    return { model, config };
  }

  static async consumeDailyCredit(
    db: TransactionCapableDatabaseClient,
    userId: string,
    dailyLimit: number,
    now: Date = new Date(),
  ): Promise<{ remainingCredits: number }> {
    return AiRepository.consumeDailyCredit(db, userId, dailyLimit, now);
  }

  static async getDailyCredits(
    db: TransactionCapableDatabaseClient,
    userId: string,
    now: Date = new Date(),
  ): Promise<DailyCreditsStatus> {
    const config = await AiService.getAiConfiguration(db);
    return AiRepository.getDailyCredits(db, userId, config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT, now);
  }

  static toAssistantScope(role: string | null | undefined, isAnonymous = false): AssistantRoleScope {
    return resolveAssistantScope(role === "ADMIN" || role === "USER" ? role : null, isAnonymous);
  }

  private static async persistAssistantTurn(options: {
    assistantMessage: AssistantUiMessage;
    config: AiConfiguration;
    db: TransactionCapableDatabaseClient;
    identity: AssistantConversationIdentity;
    request: Request;
    scope: AssistantRoleScope;
    threadId: string;
    userMessage: {
      content: string;
      id: string;
      parts: AssistantUiMessage["parts"];
    };
  }): Promise<void> {
    const assistantText = extractTextFromUiMessageParts(options.assistantMessage.parts);
    const toolNames = dedupeToolNames(collectToolNamesFromUiMessageParts(options.assistantMessage.parts));

    await ConversationMemoryService.saveAssistantUiTurn({
      assistantMessage: {
        id: options.assistantMessage.id,
        content: assistantText,
        parts: options.assistantMessage.parts,
        toolNames,
      },
      config: options.config,
      db: options.db,
      scope: options.scope,
      threadId: options.threadId,
      userId: options.identity.userId,
      userMessage: options.userMessage,
    });

    if (options.identity.role === "ADMIN") {
      await auditAdminAssistantUsage({
        userId: options.identity.userId,
        reply: assistantText,
        toolNames,
        request: options.request,
      });
    }
  }

  private static createStaticAssistantResponse(options: {
    db: TransactionCapableDatabaseClient;
    identity: AssistantConversationIdentity;
    originalMessages: AssistantUiMessage[];
    request: Request;
    responseText: string;
    runtime: OptimizationContext;
    scope: AssistantRoleScope;
    threadId: string;
    userMessage: {
      content: string;
      id: string;
      parts: AssistantUiMessage["parts"];
    };
  }): Response {
    const stream = createUIMessageStream<AssistantUiMessage>({
      originalMessages: options.originalMessages,
      generateId: () => crypto.randomUUID(),
      execute: ({ writer }) => {
        const textId = crypto.randomUUID();

        writer.write({
          type: "text-start",
          id: textId,
        });
        writer.write({
          type: "text-delta",
          id: textId,
          delta: options.responseText,
        });
        writer.write({
          type: "text-end",
          id: textId,
        });
      },
      onFinish: async ({ responseMessage }) => {
        await AiService.persistAssistantTurn({
          assistantMessage: responseMessage,
          config: options.runtime.config,
          db: options.db,
          identity: options.identity,
          request: options.request,
          scope: options.scope,
          threadId: options.threadId,
          userMessage: options.userMessage,
        });
      },
      onError: () => ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
    });

    return createUIMessageStreamResponse({ stream });
  }

  static async streamAssistantChat(
    db: TransactionCapableDatabaseClient,
    input: {
      currentPath?: string;
      message: AssistantUiMessage;
      threadId: string;
    },
    identity: AssistantConversationIdentity,
    request: Request,
  ): Promise<Response> {
    if (input.message.role !== "user") {
      throw new Error("Assistant chat requires a user message.");
    }

    const userMessageContent = extractTextFromUiMessageParts(input.message.parts);

    if (!userMessageContent) {
      throw new Error("Assistant chat requires non-empty user text.");
    }

    const scope = AiService.toAssistantScope(identity.role, identity.isAnonymous);
    const runtime = await AiService.resolveOptimizationContext(db, identity.userId, null);
    const promptContext = await ConversationMemoryService.buildPromptContext({
      config: runtime.config,
      db,
      latestUserMessage: userMessageContent,
      scope,
      threadId: input.threadId,
      userId: identity.userId,
    });
    const originalMessages = [...promptContext.messages, input.message];
    const deterministicReply =
      isConversationMemoryIntent(userMessageContent) &&
      buildDeterministicConversationReply({
        history: [
          ...toAssistantChatHistory(promptContext.messages),
          {
            role: "user",
            content: userMessageContent,
          },
        ],
        latestUserMessage: userMessageContent,
      });

    if (deterministicReply) {
      return AiService.createStaticAssistantResponse({
        db,
        identity,
        originalMessages,
        request,
        responseText: deterministicReply,
        runtime,
        scope,
        threadId: input.threadId,
        userMessage: {
          id: input.message.id,
          content: userMessageContent,
          parts: input.message.parts,
        },
      });
    }

    const toolRegistry = AiService.createToolRegistry(db, runtime.config, scope, identity.role, identity.userId);
    const promptToolNames = toolRegistry.getPromptToolNames("assistant");
    const systemPrompt = composeAiSystemPrompt({
      baseSystemPrompt: runtime.config.ASSISTANT_SYSTEM_PROMPT,
      currentPath: input.currentPath,
      flow: "assistant",
      memoryContext: promptContext.memoryContext,
      ragContext: null,
      scope,
      toolNames: promptToolNames,
    });
    const providerRegistry = createAiProviderRegistry();
    const modelMessages = await convertToModelMessages(originalMessages);
    const result = streamText({
      model: providerRegistry.getChatModel(runtime.config.ASSISTANT_MODEL_ID),
      system: systemPrompt,
      messages: modelMessages,
      tools: toolRegistry.getAssistantTools(),
      stopWhen: stepCountIs(runtime.config.ASSISTANT_MAX_STEPS),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "ai.assistant.chat",
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages,
      generateMessageId: () => crypto.randomUUID(),
      onFinish: async ({ responseMessage }) => {
        await AiService.persistAssistantTurn({
          assistantMessage: responseMessage,
          config: runtime.config,
          db,
          identity,
          request,
          scope,
          threadId: input.threadId,
          userMessage: {
            id: input.message.id,
            content: userMessageContent,
            parts: input.message.parts,
          },
        });
      },
      onError: () => ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
    });
  }

  static async getAssistantMessages(
    db: DatabaseClient,
    identity: AssistantConversationIdentity,
    query: AssistantHistoryQuery,
  ): Promise<{
    hasMore: boolean;
    messages: AssistantUiMessage[];
    nextCursor: string | null;
    scope: AssistantRoleScope;
  }> {
    const scope = AiService.toAssistantScope(identity.role, identity.isAnonymous);
    const parsedCursor = parseAssistantThreadCursor(query.cursor);
    const cursor =
      parsedCursor && !Number.isNaN(new Date(parsedCursor.createdAt).getTime())
        ? {
            createdAt: new Date(parsedCursor.createdAt),
            id: parsedCursor.id,
          }
        : null;
    const page = await ConversationMemoryService.getUiMessagePage({
      db,
      scope,
      threadId: query.threadId,
      userId: identity.userId,
      cursor,
      limit: query.limit,
    });
    const historyPage = await ConversationMemoryService.getHistory({
      db,
      scope,
      threadId: query.threadId,
      userId: identity.userId,
      cursor,
      limit: query.limit,
    });
    const oldestPersistedMessage = historyPage.messages[0] ?? null;

    return {
      scope,
      messages: page.messages,
      nextCursor:
        page.hasMore && oldestPersistedMessage
          ? buildAssistantThreadCursor({
              createdAt: oldestPersistedMessage.createdAt.toISOString(),
              id: oldestPersistedMessage.id,
            })
          : null,
      hasMore: page.hasMore,
    };
  }

  static async runCopilotOptimize(
    db: TransactionCapableDatabaseClient,
    userId: string,
    input: ResumeCopilotOptimizeInput,
  ): Promise<CopilotRunResult<ResumeCopilotOptimizeResponse>> {
    const runtime = await AiService.resolveOptimizationContext(db, userId, null);
    const credit = await AiService.consumeDailyCredit(db, userId, runtime.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT);
    const resume = await AiRepository.getOwnedResume(db, userId, input.resumeId);
    const sectionSource = getResumeSectionSource(resume, input.target);
    const snapshot = buildResumeSnapshot(resume);
    const toolRegistry = AiService.createToolRegistry(db, runtime.config, buildCopilotScope("USER"), "USER", userId);

    const result = await AiService.runStructuredModel({
      instructions: composeAiSystemPrompt({
        baseSystemPrompt: runtime.config.COPILOT_SYSTEM_PROMPT,
        flow: "copilot-optimize",
        scope: "USER",
        toolNames: toolRegistry.getPromptToolNames("copilot"),
      }),
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
      maxSteps: 2,
      modelId: runtime.model.id,
      outputDescription: "Resume optimization suggestion",
      outputSchema: optimizeModelSchema,
      tools: toolRegistry.getCopilotTools(),
    });

    return {
      response: ResumeCopilotOptimizeResponseSchema.parse({
        target: input.target,
        intent: input.intent,
        modelId: runtime.model.id,
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
    db: TransactionCapableDatabaseClient,
    userId: string,
    input: ResumeCopilotTailorInput,
  ): Promise<CopilotRunResult<ResumeCopilotTailorResponse>> {
    const runtime = await AiService.resolveOptimizationContext(db, userId, null);
    const credit = await AiService.consumeDailyCredit(db, userId, runtime.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT);
    const resume = await AiRepository.getOwnedResume(db, userId, input.resumeId);
    const snapshot = buildResumeSnapshot(resume);
    const analysis = analyzeJobDescriptionText(input.jobDescription);
    const comparison = matchResumeSnapshotToJob(snapshot, analysis);
    const allowedTargets = AiService.buildCopilotTargets(resume);
    const toolRegistry = AiService.createToolRegistry(db, runtime.config, buildCopilotScope("USER"), "USER", userId);

    const result = await AiService.runStructuredModel({
      instructions: composeAiSystemPrompt({
        baseSystemPrompt: runtime.config.COPILOT_SYSTEM_PROMPT,
        flow: "copilot-tailor",
        scope: "USER",
        toolNames: toolRegistry.getPromptToolNames("copilot"),
      }),
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
      maxSteps: 2,
      modelId: runtime.model.id,
      outputDescription: "Resume tailoring suggestions",
      outputSchema: tailorModelSchema,
      tools: toolRegistry.getCopilotTools(),
    });

    return {
      response: ResumeCopilotTailorResponseSchema.parse({
        modelId: runtime.model.id,
        creditsRemaining: credit.remainingCredits,
        jobTitle: result.data.jobTitle,
        priorities: result.data.priorities,
        matches: result.data.matches,
        gaps: result.data.gaps,
        suggestions: result.data.suggestions.map((item) => ({
          ...item,
          draftPatch: item.draftPatch ?? buildDraftPatch(ResumeSectionTargetSchema.parse(item.target), item.suggestion),
        })),
      }),
      usage: result.usage,
      promptVersion: runtime.config.PROMPT_VERSION,
    };
  }

  static async runCopilotReview(
    db: TransactionCapableDatabaseClient,
    userId: string,
    input: ResumeCopilotReviewInput,
  ): Promise<CopilotRunResult<ResumeCopilotReviewResponse>> {
    const runtime = await AiService.resolveOptimizationContext(db, userId, null);
    const credit = await AiService.consumeDailyCredit(db, userId, runtime.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT);
    const resume = await AiRepository.getOwnedResume(db, userId, input.resumeId);
    const snapshot = buildResumeSnapshot(resume);
    const analysis = input.jobDescription ? analyzeJobDescriptionText(input.jobDescription) : null;
    const comparison = analysis ? matchResumeSnapshotToJob(snapshot, analysis) : null;
    const toolRegistry = AiService.createToolRegistry(db, runtime.config, buildCopilotScope("USER"), "USER", userId);

    const result = await AiService.runStructuredModel({
      instructions: composeAiSystemPrompt({
        baseSystemPrompt: runtime.config.COPILOT_SYSTEM_PROMPT,
        flow: "copilot-review",
        scope: "USER",
        toolNames: toolRegistry.getPromptToolNames("copilot"),
      }),
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
      maxSteps: 2,
      modelId: runtime.model.id,
      outputDescription: "Resume review findings",
      outputSchema: reviewModelSchema,
      tools: toolRegistry.getCopilotTools(),
    });

    return {
      response: ResumeCopilotReviewResponseSchema.parse({
        modelId: runtime.model.id,
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

  static async createOptimizeStream(input: string, modelId: string, systemPrompt: string): Promise<StreamTextHandle> {
    const providerRegistry = createAiProviderRegistry();

    return streamText({
      model: providerRegistry.getChatModel(modelId),
      system: systemPrompt,
      messages: [{ role: "user", content: input }],
      experimental_telemetry: {
        isEnabled: true,
        functionId: "ai.optimize.stream",
      },
    });
  }

  static async *streamOptimizeText(
    stream: StreamTextHandle,
    options?: StreamOptimizeTextOptions,
  ): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream.textStream) {
      yield chunk;
    }

    const usage = await stream.totalUsage;
    options?.onUsage?.(toUsageMetrics(usage));
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

  static async saveOptimization(db: DatabaseClient, payload: SaveOptimizationInput): Promise<void> {
    await AiRepository.saveOptimization(db, payload);
  }

  static async saveCopilotResult(
    db: DatabaseClient,
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
    db: DatabaseClient,
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

  private static createToolRegistry(
    db: TransactionCapableDatabaseClient | DatabaseClient,
    config: AiConfiguration,
    scope: AssistantRoleScope,
    role: AssistantConversationIdentity["role"],
    userId: string | null,
  ) {
    return createAiToolRegistry({
      db,
      role,
      scope,
      userId,
      getAiConfiguration: async () => config,
      getCurrentModelSettings: async () => {
        if (!userId) {
          return null;
        }

        const settings = await AiService.getUserAiSettings(db, userId);

        return {
          selectedModelId: settings.selectedModelId,
          models: settings.models.map((item) => item.id),
        };
      },
      getOptimizationCredits: async () => {
        if (!userId) {
          return null;
        }

        return AiService.getDailyCredits(db as TransactionCapableDatabaseClient, userId);
      },
    });
  }

  private static async runStructuredModel<T extends Record<string, unknown>>(options: {
    instructions: string;
    input: Array<{ role: "assistant" | "user"; content: string }>;
    maxSteps: number;
    modelId: string;
    outputDescription: string;
    outputSchema: z.ZodType<T>;
    tools: ToolSet;
  }): Promise<StructuredModelResult<T>> {
    const providerRegistry = createAiProviderRegistry();
    const result = await generateText({
      model: providerRegistry.getChatModel(options.modelId),
      system: options.instructions,
      messages: options.input,
      tools: options.tools,
      stopWhen: stepCountIs(options.maxSteps),
      output: Output.object({
        schema: options.outputSchema,
        name: "copilot_result",
        description: options.outputDescription,
      }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "ai.copilot.structured",
      },
    });

    return {
      data: result.output,
      usage: toUsageMetrics(result.usage),
      toolNames: dedupeToolNames(result.toolCalls.map((toolCall) => toolCall.toolName)),
    };
  }

  private static buildCopilotTargets(resume: Awaited<ReturnType<typeof AiRepository.getOwnedResume>>) {
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
      return DEFAULT_CONFIGURATION_VALUE;
    }

    return parsedConfiguration.data;
  }

  private static resolveModelId(
    models: ActiveAiModel[],
    savedModelId: string,
    requestedModelId: string | null,
  ): string {
    if (models.length === 0) {
      throw new AiModelUnavailableError(ERROR_MESSAGES.AI_NO_ACTIVE_MODELS);
    }

    if (requestedModelId) {
      if (!models.some((m) => m.id === requestedModelId)) {
        throw new AiModelUnavailableError();
      }
      return requestedModelId;
    }

    if (models.some((m) => m.id === savedModelId)) {
      return savedModelId;
    }

    return DEFAULT_AI_MODEL;
  }
}

import type { Prisma, PrismaClient } from "@rezumerai/database";
import {
  type AiConfiguration,
  AiConfigurationSchema,
  type AssistantChatInput,
  type AssistantChatMessage,
  type AssistantChatResponse,
  type AssistantHistoryQuery,
  type AssistantHistoryResponse,
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
  ResumeSectionTargetSchema,
} from "@rezumerai/types";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import { runMastraAssistantChat } from "./assistant-agent";
import {
  buildAssistantResourceId,
  buildAssistantScopedThreadId,
  buildAssistantThreadCursor,
  buildDeterministicConversationReply,
  getLatestUserMessage,
  isConversationMemoryIntent,
  parseAssistantThreadCursor,
  resolveAssistantScope,
} from "./assistant-chat";
import { DEFAULT_AI_SETTINGS, openRouterProviderName } from "./constants";
import { AiCreditsExhaustedError, AiModelPolicyRestrictedError, AiModelUnavailableError } from "./errors";
import { emptyAiUsageMetrics } from "./mapper";
import { buildAssistantMemoryConfig } from "./memory/config";
import { ConversationMemoryService } from "./memory/service";
import { openRouterAiProvider } from "./providers/openrouter-provider";
import type { AiProvider, StructuredModelCallOptions, TextModelCallOptions } from "./providers/provider";
import { AiRepository } from "./repository";
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
  TextModelResult,
  UserAiSettings,
} from "./types";
import {
  analyzeJobDescriptionText,
  buildDraftPatch,
  buildResumeSnapshot,
  compactText,
  formatAssistantReply,
  getResumeSectionSource,
  matchResumeSnapshotToJob,
  parseAssistantReplyBlocks,
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

const defaultAiProvider: AiProvider = openRouterAiProvider;
type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;

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

// biome-ignore lint/complexity/noStaticOnlyClass: The AI service exposes a stable facade while delegating IO to repositories and providers.
export abstract class AiService {
  static readonly DEFAULT_CONFIGURATION = DEFAULT_AI_SETTINGS;

  private static provider: AiProvider = defaultAiProvider;

  static configureProvider(provider: AiProvider): void {
    AiService.provider = provider;
  }

  static resetProvider(): void {
    AiService.provider = defaultAiProvider;
  }

  static emptyUsageMetrics(): AiUsageMetrics {
    return emptyAiUsageMetrics();
  }

  static async listActiveModels(db: DatabaseClient): Promise<ActiveAiModel[]> {
    return AiRepository.listActiveModels(db);
  }

  static async getAiConfiguration(db: DatabaseClient): Promise<AiConfiguration> {
    const configurationValue = await AiRepository.getAiConfigurationValue(db);

    if (!configurationValue) {
      return DEFAULT_AI_CONFIGURATION;
    }

    return AiService.parseAiConfiguration(configurationValue);
  }

  static async getUserAiSettings(db: DatabaseClient, userId: string): Promise<UserAiSettings> {
    const [models, user] = await Promise.all([
      AiService.listActiveModels(db),
      AiRepository.getUserSelectedModelRecord(db, userId),
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

  static async updateUserSelectedModel(db: DatabaseClient, userId: string, modelId: string): Promise<string> {
    const models = await AiService.listActiveModels(db);
    const selectedModel = models.find((model) => model.modelId === modelId);

    if (!selectedModel) {
      throw new AiModelUnavailableError();
    }

    await AiRepository.updateUserSelectedModel(db, userId, selectedModel.id);

    return selectedModel.modelId;
  }

  static async resolveOptimizationContext(
    db: DatabaseClient,
    userId: string | null,
    requestedModelId?: string | null,
  ): Promise<OptimizationContext> {
    const [models, config, user] = await Promise.all([
      AiService.listActiveModels(db),
      AiService.getAiConfiguration(db),
      userId ? AiRepository.getUserSelectedModelRecord(db, userId) : Promise.resolve(null),
    ]);

    if (userId && !user) {
      throw new Error(ERROR_MESSAGES.AI_USER_NOT_FOUND);
    }

    return {
      model: AiService.resolveSelectedModel(models, user?.selectedAiModelId ?? null, requestedModelId ?? null),
      config,
    };
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

  static async runAssistantChat(
    db: TransactionCapableDatabaseClient,
    input: AssistantChatInput,
    identity: AssistantConversationIdentity,
  ): Promise<AssistantChatResponse> {
    const scope = AiService.toAssistantScope(identity.role, identity.isAnonymous);
    const runtime = await AiService.resolveOptimizationContext(db, identity.userId, null);
    const latestUserTurn = getLatestUserMessage(input.messages);

    if (!latestUserTurn) {
      throw new Error("Assistant chat requires a user message.");
    }

    const resourceId = buildAssistantResourceId({
      userId: identity.userId,
      role: identity.role,
      isAnonymous: identity.isAnonymous,
    });
    const scopedThreadId = buildAssistantScopedThreadId({
      resourceId,
      threadId: input.threadId,
    });
    const ownerKind = identity.isAnonymous ? "guest" : identity.role === "ADMIN" ? "admin" : "user";

    await ConversationMemoryService.ensureThread({
      config: runtime.config,
      ownerKind,
      ownerUserId: identity.userId,
      resourceId,
      scope,
      threadId: scopedThreadId,
    });
    const isConversationRequest = isConversationMemoryIntent(latestUserTurn.content);

    const result = isConversationRequest
      ? await AiService.answerConversationFromHistory({
          config: runtime.config,
          scope,
          modelId: runtime.model.modelId,
          systemPrompt: runtime.config.ASSISTANT_SYSTEM_PROMPT,
          maxSteps: 1,
          latestUserMessage: latestUserTurn.content,
          currentPath: input.currentPath,
          resourceId,
          threadId: scopedThreadId,
        })
      : await AiService.answerAssistantDataRequest(db, {
          config: runtime.config,
          scope,
          role: identity.role,
          userId: identity.userId,
          modelId: runtime.model.modelId,
          systemPrompt: runtime.config.ASSISTANT_SYSTEM_PROMPT,
          maxSteps: runtime.config.ASSISTANT_MAX_STEPS,
          latestUserMessage: latestUserTurn.content,
          currentPath: input.currentPath,
          resourceId,
          threadId: scopedThreadId,
        });
    const blocks = parseAssistantReplyBlocks(result.reply);

    if (!result.persistedByMemory) {
      await ConversationMemoryService.saveExchange({
        config: runtime.config,
        resourceId,
        threadId: scopedThreadId,
        userMessage: latestUserTurn.content,
        assistantMessage: result.reply,
      });
    }

    return {
      scope,
      reply: result.reply,
      blocks,
      toolNames: result.toolNames,
      usedConversationMemory: isConversationRequest || result.usedMemory,
    };
  }

  static async getAssistantHistory(
    db: DatabaseClient,
    identity: AssistantConversationIdentity,
    query: AssistantHistoryQuery,
  ): Promise<AssistantHistoryResponse> {
    const scope = AiService.toAssistantScope(identity.role, identity.isAnonymous);
    const resourceId = buildAssistantResourceId({
      userId: identity.userId,
      role: identity.role,
      isAnonymous: identity.isAnonymous,
    });
    const scopedThreadId = buildAssistantScopedThreadId({
      resourceId,
      threadId: query.threadId,
    });
    const parsedCursor = parseAssistantThreadCursor(query.cursor);
    const cursor =
      parsedCursor && !Number.isNaN(new Date(parsedCursor.createdAt).getTime())
        ? {
            createdAt: new Date(parsedCursor.createdAt),
            id: parsedCursor.id,
          }
        : null;
    const config = await AiService.getAiConfiguration(db);
    const page = await ConversationMemoryService.getHistory({
      config,
      cursor,
      limit: query.limit,
      resourceId,
      threadId: scopedThreadId,
    });
    const oldestMessage = page.messages[0] ?? null;

    return {
      scope,
      messages: page.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
      nextCursor:
        page.hasMore && oldestMessage
          ? buildAssistantThreadCursor({
              createdAt: oldestMessage.createdAt.toISOString(),
              id: oldestMessage.id,
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

  static async createOptimizeStream(
    input: string,
    modelId: string,
    systemPrompt: string,
  ): Promise<AsyncIterable<unknown>> {
    return AiService.provider.createOptimizeStream({
      input,
      modelId,
      systemPrompt,
    });
  }

  static async *streamOptimizeText(
    stream: AsyncIterable<unknown>,
    options?: StreamOptimizeTextOptions,
  ): AsyncGenerator<string, void, unknown> {
    yield* AiService.provider.streamOptimizeText(stream, options);
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

  private static async answerAssistantDataRequest(
    db: TransactionCapableDatabaseClient,
    options: {
      config: AiConfiguration;
      scope: AssistantRoleScope;
      role: "ADMIN" | "USER" | null;
      userId: string | null;
      modelId: string;
      systemPrompt: string;
      maxSteps: number;
      latestUserMessage: string;
      currentPath?: string;
      resourceId: string;
      threadId: string;
    },
  ): Promise<{ persistedByMemory: boolean; reply: string; toolNames: string[]; usedMemory: boolean }> {
    const knowledgeContext = await ConversationMemoryService.buildKnowledgeContext({
      config: options.config,
      db,
      latestUserMessage: options.latestUserMessage,
    });
    const result = await runMastraAssistantChat({
      db,
      scope: options.scope,
      userId: options.userId,
      resourceId: options.resourceId,
      threadId: options.threadId,
      memoryOptions: buildAssistantMemoryConfig(options.config),
      getOptimizationCredits: async () => (options.userId ? AiService.getDailyCredits(db, options.userId) : null),
      getCurrentModelSettings: async () => {
        if (!options.userId) {
          return null;
        }

        const settings = await AiService.getUserAiSettings(db, options.userId);

        return {
          selectedModelId: settings.selectedModelId,
          models: settings.models.map((item) => item.modelId),
        };
      },
      getAiConfiguration: async () => AiService.getAiConfiguration(db),
      modelId: options.modelId,
      systemPrompt: options.systemPrompt,
      maxSteps: options.maxSteps,
      latestUserMessage: options.latestUserMessage,
      currentPath: options.currentPath,
      history: [],
      contextMessages: knowledgeContext ? [knowledgeContext] : undefined,
    });

    return {
      persistedByMemory: result.persistedByMemory,
      reply: formatAssistantReply(result.reply, 4000),
      toolNames: result.toolNames,
      usedMemory: result.usedMemory || Boolean(knowledgeContext),
    };
  }

  private static async answerConversationFromHistory(options: {
    config: AiConfiguration;
    scope: AssistantRoleScope;
    modelId: string;
    systemPrompt: string;
    maxSteps: number;
    latestUserMessage: string;
    currentPath?: string;
    resourceId: string;
    threadId: string;
  }): Promise<{ persistedByMemory: boolean; reply: string; toolNames: string[]; usedMemory: boolean }> {
    const history = await ConversationMemoryService.buildConversationContext({
      config: options.config,
      latestUserMessage: options.latestUserMessage,
      resourceId: options.resourceId,
      threadId: options.threadId,
    });
    const normalizedHistory: AssistantChatMessage[] = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const directReply = buildDeterministicConversationReply({
      history: normalizedHistory,
      latestUserMessage: options.latestUserMessage,
    });

    if (directReply) {
      return {
        persistedByMemory: false,
        reply: formatAssistantReply(directReply, 4000),
        toolNames: [],
        usedMemory: normalizedHistory.length > 0,
      };
    }

    const result = await AiService.runTextModel({
      modelId: options.modelId,
      instructions:
        `${AiService.buildAssistantInstructions({
          scope: options.scope,
          systemPrompt: options.systemPrompt,
          currentPath: options.currentPath,
          allowTools: false,
        })} ` +
        "Answer only from the conversation history already provided. If the answer is not in this chat, say so plainly.",
      input: normalizedHistory,
      tools: [],
      maxSteps: options.maxSteps,
    });

    return {
      persistedByMemory: false,
      reply: formatAssistantReply(result.text, 4000),
      toolNames: result.toolNames,
      usedMemory: normalizedHistory.length > 0,
    };
  }

  private static buildAssistantInstructions(options: {
    scope: AssistantRoleScope;
    systemPrompt: string;
    currentPath?: string;
    allowTools: boolean;
  }): string {
    const pathInstruction = options.currentPath ? ` CurrentPage=${options.currentPath}.` : "";

    return (
      `${options.systemPrompt} ` +
      `Scope=${options.scope}. ${options.allowTools ? "Use tools only when real application data is required." : "Do not call tools."}` +
      pathInstruction +
      " Keep the reply short. Tool results use a structured JSON envelope with `type`, `entity`, and `summary`; when listing records, prefer readable labels and omit raw IDs unless the user explicitly asks for them. Never expose raw database field names or JSON-style keys in the final reply. Format replies as: short intro line, blank line, optional `**Section:**` headers on their own lines, list items one per line, blank line, short closing line if needed."
    );
  }

  private static async runStructuredModel<T extends Record<string, unknown>>(
    options: StructuredModelCallOptions<T>,
  ): Promise<StructuredModelResult<T>> {
    return AiService.provider.runStructuredModel(options);
  }

  private static async runTextModel(options: TextModelCallOptions): Promise<TextModelResult> {
    return AiService.provider.runTextModel(options);
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

    const [fallbackModel] = models;

    if (!fallbackModel) {
      throw new AiModelUnavailableError(ERROR_MESSAGES.AI_NO_ACTIVE_MODELS);
    }

    return fallbackModel;
  }
}

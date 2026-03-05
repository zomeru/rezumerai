import { OpenRouter } from "@openrouter/sdk";
import type { Prisma, PrismaClient } from "@rezumerai/database";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import { serverEnv } from "@/env";

const openrouter = new OpenRouter({
  apiKey: serverEnv?.OPENROUTER_API_KEY,
});

const AI_CONFIGURATION_NAME = "AI_CONFIG";
const AI_CONFIGURATION_SCHEMA = z.object({
  PROMPT_VERSION: z.string().trim().min(1).max(100),
  DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: z.number().int().min(1).max(1000),
  OPTIMIZE_SYSTEM_PROMPT: z.string().trim().min(1).max(10000),
});
const ASIA_MANILA_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
const DEFAULT_AI_CONFIGURATION: AiConfiguration = {
  PROMPT_VERSION: "optimize-v1",
  DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 100,
  OPTIMIZE_SYSTEM_PROMPT:
    "You are a professional text editor. Your task is to optimize the given text by improving clarity, fixing grammar, correcting spelling, and enhancing readability. Return only the optimized text with no explanations, preamble, or commentary.",
};

export const AI_CREDITS_EXHAUSTED_CODE = "AI_CREDITS_EXHAUSTED";
export const AI_MODEL_UNAVAILABLE_CODE = "AI_MODEL_UNAVAILABLE";
export const AI_FORBIDDEN_CODE = "AI_FORBIDDEN";

export type AiConfiguration = z.infer<typeof AI_CONFIGURATION_SCHEMA>;

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
  isAdmin: boolean;
  config: AiConfiguration | null;
}

interface OptimizationContext {
  model: ActiveAiModel;
  config: AiConfiguration;
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

export class AiForbiddenError extends Error {
  readonly code: string = AI_FORBIDDEN_CODE;

  constructor() {
    super(ERROR_MESSAGES.AI_ADMIN_REQUIRED);
    this.name = "AiForbiddenError";
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: Elysia best practice — abstract class avoids allocation when no state is stored.
export abstract class AiService {
  static readonly DEFAULT_CONFIGURATION = DEFAULT_AI_CONFIGURATION;

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
      where: { name: AI_CONFIGURATION_NAME },
      select: { value: true },
    });

    if (!configuration) {
      return DEFAULT_AI_CONFIGURATION;
    }

    return AiService.parseAiConfiguration(configuration.value);
  }

  static async getUserAiSettings(db: PrismaClient, userId: string): Promise<UserAiSettings> {
    const [models, config, user] = await Promise.all([
      AiService.listActiveModels(db),
      AiService.getAiConfiguration(db),
      db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
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
      isAdmin: user.role === "ADMIN",
      config: user.role === "ADMIN" ? config : null,
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

  static async updateAiConfiguration(
    db: PrismaClient,
    userId: string,
    configuration: AiConfiguration,
  ): Promise<AiConfiguration> {
    await AiService.assertAdmin(db, userId);

    const parsedConfiguration = AI_CONFIGURATION_SCHEMA.parse(configuration);
    const value = parsedConfiguration as unknown as Prisma.InputJsonValue;

    await db.systemConfiguration.upsert({
      where: { name: AI_CONFIGURATION_NAME },
      update: { value },
      create: {
        name: AI_CONFIGURATION_NAME,
        value,
      },
    });

    return parsedConfiguration;
  }

  static async resolveOptimizationContext(
    db: PrismaClient,
    userId: string,
    requestedModelId?: string | null,
  ): Promise<OptimizationContext> {
    const [models, config, user] = await Promise.all([
      AiService.listActiveModels(db),
      AiService.getAiConfiguration(db),
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

    const model = AiService.resolveSelectedModel(models, user.selectedAiModelId ?? null, requestedModelId ?? null);

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

  /**
   * Streams optimized text from OpenRouter and yields string chunks as they arrive.
   * The caller is responsible for consuming the async generator.
   *
   * @param input - Raw user text to optimize
   */
  static async *streamOptimizeText(
    input: string,
    modelId: string,
    systemPrompt: string,
    options?: StreamOptimizeTextOptions,
  ): AsyncGenerator<string, void, unknown> {
    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
        stream: true,
      },
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
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

  private static parseAiConfiguration(value: Prisma.JsonValue): AiConfiguration {
    const parsedConfiguration = AI_CONFIGURATION_SCHEMA.safeParse(value);

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

    // biome-ignore lint/style/noNonNullAssertion: Guarded above by the models.length check.
    return models[0]!;
  }

  private static formatProviderName(providerName: string): string {
    return providerName
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
      .join(" ");
  }

  private static async assertAdmin(db: PrismaClient, userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
      },
    });

    if (!user || user.role !== "ADMIN") {
      throw new AiForbiddenError();
    }
  }

  private static getAsiaManilaMidnightBoundary(date: Date): Date {
    const manilaDate = new Date(date.getTime() + ASIA_MANILA_UTC_OFFSET_MS);
    manilaDate.setUTCHours(0, 0, 0, 0);

    return new Date(manilaDate.getTime() - ASIA_MANILA_UTC_OFFSET_MS);
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

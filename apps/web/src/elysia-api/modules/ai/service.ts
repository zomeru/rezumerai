import { OpenRouter } from "@openrouter/sdk";
import type { PrismaClient } from "@rezumerai/database";
import { ERROR_MESSAGES } from "@/constants/errors";
import { serverEnv } from "@/env";

const openrouter = new OpenRouter({
  apiKey: serverEnv?.OPENROUTER_API_KEY,
});

// TODO: Make this configurable by the user later on
const PROVIDER = "openrouter";
const MODELS = [
  {
    name: "Arcee AI: Trinity Large Preview (free)",
    id: "arcee-ai/trinity-large-preview:free",
  },
  {
    name: "StepFun: Step 3.5 Flash (free)",
    id: "stepfun/step-3.5-flash:free",
  },
  {
    name: "Z.ai: GLM 4.5 Air (free)",
    id: "z-ai/glm-4.5-air:free",
  },
  {
    name: "NVIDIA: Nemotron 3 Nano 30B A3B (free)",
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
  },
  {
    name: "Qwen: Qwen3 235B A22B Thinking 2507",
    id: "qwen/qwen3-235b-a22b-thinking-2507",
  },
  {
    name: "OpenAI: gpt-oss-120b (free)",
    id: "openai/gpt-oss-120b:free",
  },
  {
    name: "Meta: Llama 3.3 70B Instruct (free)",
    id: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    name: "Google: Gemma 3 27B (free)",
    id: "google/gemma-3-27b-it:free",
  },
];
// biome-ignore lint/style/noNonNullAssertion: We ensure this at build time via env validation.
const DEFAULT_MODEL = MODELS[0]!.id;

// TODO: Make this configurable by admin via UI
const PROMPT_VERSION = "optimize-v1";
const DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT = 100;
const ASIA_MANILA_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
const OPTIMIZE_SYSTEM_PROMPT =
  "You are a professional text editor. Your task is to optimize the given text by improving clarity, fixing grammar, correcting spelling, and enhancing readability. Return only the optimized text with no explanations, preamble, or commentary.";

export const AI_CREDITS_EXHAUSTED_CODE = "AI_CREDITS_EXHAUSTED";

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

export class AiCreditsExhaustedError extends Error {
  readonly code: string = AI_CREDITS_EXHAUSTED_CODE;

  constructor() {
    super(ERROR_MESSAGES.AI_CREDITS_EXHAUSTED);
    this.name = "AiCreditsExhaustedError";
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: Elysia best practice — abstract class avoids allocation when no state is stored.
export abstract class AiService {
  static readonly MODEL = DEFAULT_MODEL;

  static readonly PROVIDER = PROVIDER;

  static readonly PROMPT_VERSION = PROMPT_VERSION;

  static readonly DAILY_CREDIT_LIMIT = DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT;

  static emptyUsageMetrics(): AiUsageMetrics {
    return {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      reasoningTokens: null,
    };
  }

  static async consumeDailyCredit(
    db: PrismaClient,
    userId: string,
    now: Date = new Date(),
  ): Promise<ConsumeDailyCreditResult> {
    const todayBoundary = AiService.getAsiaManilaMidnightBoundary(now);

    return db.$transaction(async (tx) => {
      await AiService.ensureDailyCreditsWindow(tx, userId, todayBoundary);

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
    const todayBoundary = AiService.getAsiaManilaMidnightBoundary(now);

    return db.$transaction(async (tx) => {
      await AiService.ensureDailyCreditsWindow(tx, userId, todayBoundary);

      const creditsRecord = await tx.aiTextOptimizerCredits.findUnique({
        where: { userId },
        select: { credits: true },
      });

      return {
        remainingCredits: creditsRecord?.credits ?? DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT,
        dailyLimit: DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT,
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
    options?: StreamOptimizeTextOptions,
  ): AsyncGenerator<string, void, unknown> {
    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: OPTIMIZE_SYSTEM_PROMPT },
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
        provider: PROVIDER,
        model: DEFAULT_MODEL,
        promptVersion: PROMPT_VERSION,
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

  private static getAsiaManilaMidnightBoundary(date: Date): Date {
    const manilaDate = new Date(date.getTime() + ASIA_MANILA_UTC_OFFSET_MS);
    manilaDate.setUTCHours(0, 0, 0, 0);

    return new Date(manilaDate.getTime() - ASIA_MANILA_UTC_OFFSET_MS);
  }

  private static async ensureDailyCreditsWindow(
    db: Pick<PrismaClient, "aiTextOptimizerCredits">,
    userId: string,
    todayBoundary: Date,
  ): Promise<void> {
    await db.aiTextOptimizerCredits.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        credits: DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT,
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
        credits: DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT,
        lastResetAt: todayBoundary,
      },
    });
  }
}

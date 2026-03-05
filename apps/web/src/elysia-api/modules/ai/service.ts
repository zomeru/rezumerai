import { OpenRouter } from "@openrouter/sdk";
import type { PrismaClient } from "@rezumerai/database";
import { serverEnv } from "@/env";

if (!serverEnv?.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required for AI features");
}

const openrouter = new OpenRouter({
  apiKey: serverEnv.OPENROUTER_API_KEY,
});

const OPTIMIZE_SYSTEM_PROMPT =
  "You are a professional text editor. Your task is to optimize the given text by improving clarity, fixing grammar, correcting spelling, and enhancing readability. Return only the optimized text with no explanations, preamble, or commentary.";

// TODO: Make this configurable by the user later on
const MODEL = "arcee-ai/trinity-large-preview:free";
const PROVIDER = "openrouter";
const PROMPT_VERSION = "optimize-v1";

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

// biome-ignore lint/complexity/noStaticOnlyClass: Elysia best practice — abstract class avoids allocation when no state is stored.
export abstract class AiService {
  static readonly MODEL = MODEL;

  static readonly PROVIDER = PROVIDER;

  static readonly PROMPT_VERSION = PROMPT_VERSION;

  static emptyUsageMetrics(): AiUsageMetrics {
    return {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      reasoningTokens: null,
    };
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
        model: MODEL,
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
        model: MODEL,
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
}

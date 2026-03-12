import { ERROR_MESSAGES } from "@/constants/errors";
import { AI_CREDITS_EXHAUSTED_CODE, AI_MODEL_POLICY_RESTRICTED_CODE, AI_MODEL_UNAVAILABLE_CODE } from "../constants";
import { AiCreditsExhaustedError, AiModelPolicyRestrictedError, AiModelUnavailableError, AiService } from "../service";
import type { OptimizationContext } from "../types";
import { ensureVerifiedAiUser, routeResult, trackAiHandledError } from "./helpers";
import type { OptimizeTextBody, RouteResult, TransactionCapableDatabaseClient, VerifiedAiUser } from "./types";

async function persistOptimizationSafely(
  db: TransactionCapableDatabaseClient,
  payload: Parameters<typeof AiService.saveOptimization>[1],
): Promise<void> {
  try {
    await AiService.saveOptimization(db, payload);
  } catch (saveError: unknown) {
    const message = saveError instanceof Error ? saveError.message : ERROR_MESSAGES.AI_UNKNOWN_PERSISTENCE_ERROR;
    console.error(`[AI] Failed to persist optimization: ${message}`);
  }
}

export async function handleOptimizeTextRequest(options: {
  body: OptimizeTextBody;
  db: TransactionCapableDatabaseClient;
  request: Request;
  user: VerifiedAiUser;
}): Promise<
  RouteResult<{
    200: AsyncGenerator<string, void, unknown>;
    403: string;
    422:
      | string
      | {
          code: typeof AI_MODEL_POLICY_RESTRICTED_CODE | typeof AI_MODEL_UNAVAILABLE_CODE;
          message: string;
        };
    429: {
      code: typeof AI_CREDITS_EXHAUSTED_CODE;
      message: string;
    };
  }>
> {
  const verificationResult = await ensureVerifiedAiUser({
    request: options.request,
    route: "/ai/optimize",
    user: options.user,
  });

  if (verificationResult) {
    return verificationResult;
  }

  const input = (options.body.prompt ?? options.body.text ?? "").trim();
  const modelId = options.body.modelId?.trim();
  const trackedRequestContext = {
    request: options.request,
    route: "/ai/optimize",
    userId: options.user.id,
    body: options.body,
  } as const;

  if (!input) {
    return routeResult(422, ERROR_MESSAGES.AI_EMPTY_INPUT);
  }

  let optimizationContext: OptimizationContext;

  try {
    optimizationContext = await AiService.resolveOptimizationContext(options.db, options.user.id, modelId ?? null);
  } catch (error: unknown) {
    if (error instanceof AiModelUnavailableError) {
      await trackAiHandledError({
        ...trackedRequestContext,
        error,
        metadata: {
          responseStatus: 422,
          phase: "resolve-optimization-context",
          reason: AI_MODEL_UNAVAILABLE_CODE,
        },
      });

      return routeResult(422, error.message);
    }

    throw error;
  }

  const dailyLimit = optimizationContext.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT;
  let remainingCredits = 0;

  try {
    const consumeResult = await AiService.consumeDailyCredit(options.db, options.user.id, dailyLimit);
    remainingCredits = consumeResult.remainingCredits;
  } catch (error: unknown) {
    if (error instanceof AiCreditsExhaustedError) {
      await trackAiHandledError({
        ...trackedRequestContext,
        error,
        metadata: {
          responseStatus: 429,
          phase: "consume-daily-credit",
          reason: AI_CREDITS_EXHAUSTED_CODE,
        },
      });

      return routeResult(429, {
        code: AI_CREDITS_EXHAUSTED_CODE,
        message: ERROR_MESSAGES.AI_CREDITS_EXHAUSTED,
      } satisfies {
        code: typeof AI_CREDITS_EXHAUSTED_CODE;
        message: string;
      });
    }

    throw error;
  }

  const startedAt = Date.now();
  const usageMetrics = AiService.emptyUsageMetrics();
  let stream: Awaited<ReturnType<typeof AiService.createOptimizeStream>>;

  try {
    stream = await AiService.createOptimizeStream(
      input,
      optimizationContext.model.id,
      optimizationContext.config.OPTIMIZE_SYSTEM_PROMPT,
    );
  } catch (error: unknown) {
    const normalizedError = AiService.normalizeOptimizationError(error);
    const responseCode: typeof AI_MODEL_POLICY_RESTRICTED_CODE | typeof AI_MODEL_UNAVAILABLE_CODE =
      normalizedError instanceof AiModelPolicyRestrictedError
        ? AI_MODEL_POLICY_RESTRICTED_CODE
        : AI_MODEL_UNAVAILABLE_CODE;

    await trackAiHandledError({
      ...trackedRequestContext,
      error: normalizedError,
      metadata: {
        responseStatus: 422,
        phase: "create-optimize-stream",
        reason: responseCode,
        modelId: optimizationContext.model.id,
        provider: "openrouter",
      },
    });

    await persistOptimizationSafely(options.db, {
      userId: options.user.id,
      provider: "openrouter",
      model: optimizationContext.model.id,
      promptVersion: optimizationContext.config.PROMPT_VERSION,
      resumeId: options.body.resumeId?.trim() || null,
      inputText: input,
      optimizedText: "",
      status: "failed",
      durationMs: Date.now() - startedAt,
      chunkCount: 0,
      errorMessage: normalizedError.message,
      usage: usageMetrics,
    });

    return routeResult(422, {
      code: responseCode,
      message: normalizedError.message,
    });
  }

  const headers = {
    "content-type": "text/plain; charset=utf-8",
    "x-content-type-options": "nosniff",
    "cache-control": "no-cache, no-store",
    "x-ai-credits-remaining": String(remainingCredits),
  };

  return routeResult(
    200,
    (async function* (): AsyncGenerator<string, void, unknown> {
      let optimizedText = "";
      let chunkCount = 0;
      let optimizationStatus: "success" | "failed" | "aborted" = "success";
      let errorMessage: string | null = null;

      try {
        for await (const chunk of AiService.streamOptimizeText(stream, {
          onUsage: (usage): void => {
            usageMetrics.promptTokens = usage.promptTokens;
            usageMetrics.completionTokens = usage.completionTokens;
            usageMetrics.totalTokens = usage.totalTokens;
            usageMetrics.reasoningTokens = usage.reasoningTokens;
          },
        })) {
          chunkCount += 1;
          optimizedText += chunk;
          yield chunk;
        }
      } catch (error: unknown) {
        optimizationStatus = "failed";
        errorMessage = AiService.normalizeOptimizationError(error).message;
        await trackAiHandledError({
          ...trackedRequestContext,
          error,
          metadata: {
            phase: "stream-optimize-text",
            reason: "AI_STREAM_RUNTIME_ERROR",
            modelId: optimizationContext.model.id,
            provider: "openrouter",
          },
        });
        return;
      } finally {
        if (optimizationStatus === "success" && options.request.signal.aborted) {
          optimizationStatus = "aborted";
          errorMessage = ERROR_MESSAGES.AI_STREAM_CANCELLED;
        }

        await persistOptimizationSafely(options.db, {
          userId: options.user.id,
          provider: "openrouter",
          model: optimizationContext.model.id,
          promptVersion: optimizationContext.config.PROMPT_VERSION,
          resumeId: options.body.resumeId?.trim() || null,
          inputText: input,
          optimizedText,
          status: optimizationStatus,
          durationMs: Date.now() - startedAt,
          chunkCount,
          errorMessage,
          usage: usageMetrics,
        });
      }
    })(),
    headers,
  );
}

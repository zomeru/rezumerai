import Elysia, { t } from "elysia";
import { ZodError } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import { authPlugin } from "../../plugins/auth";
import { trackHandledError } from "../../plugins/error";
import { prismaPlugin } from "../../plugins/prisma";
import { AiModel } from "./model";
import {
  AI_CREDITS_EXHAUSTED_CODE,
  AI_FORBIDDEN_CODE,
  AI_MODEL_POLICY_RESTRICTED_CODE,
  AI_MODEL_UNAVAILABLE_CODE,
  AiCreditsExhaustedError,
  AiForbiddenError,
  AiModelPolicyRestrictedError,
  AiModelUnavailableError,
  AiService,
} from "./service";

interface TrackAiHandledErrorOptions {
  request: Request;
  route: string;
  userId: string;
  error: unknown;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  metadata?: Record<string, unknown>;
}

async function trackAiHandledError(options: TrackAiHandledErrorOptions): Promise<void> {
  await trackHandledError({
    request: options.request,
    error: options.error,
    code: "AI_HANDLED_ERROR",
    body: options.body,
    query: options.query,
    params: options.params,
    userId: options.userId,
    metadata: {
      module: "ai",
      route: options.route,
      ...options.metadata,
    },
  });
}

/**
 * AI module — text optimization via OpenRouter streaming.
 *
 * POST /api/ai/optimize
 *   Body: { text: string }
 *   Response: text/plain stream — chunks arrive progressively as the model generates them.
 */
export const aiModule = new Elysia({ name: "module/ai", prefix: "/ai" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(AiModel)
  .get(
    "/models",
    async ({ db, status }) => {
      const models = await AiService.listActiveModels(db);
      return status(200, models);
    },
    {
      response: {
        200: "ai.ModelOptionList",
      },
      detail: {
        summary: "List all active AI models",
        tags: ["AI"],
      },
    },
  )
  .get(
    "/settings",
    async ({ db, user, status }) => {
      const settings = await AiService.getUserAiSettings(db, user.id);
      return status(200, settings);
    },
    {
      response: {
        200: "ai.Settings",
      },
      detail: {
        summary: "Fetch AI model and configuration settings for the current user",
        tags: ["AI"],
      },
    },
  )
  .patch(
    "/settings/model",
    async ({ db, user, body, status, request }) => {
      try {
        await AiService.updateUserSelectedModel(db, user.id, body.modelId.trim());
        const settings = await AiService.getUserAiSettings(db, user.id);
        return status(200, settings);
      } catch (error: unknown) {
        if (error instanceof AiModelUnavailableError) {
          await trackAiHandledError({
            request,
            route: "/ai/settings/model",
            userId: user.id,
            body,
            error,
            metadata: {
              responseStatus: 422,
              reason: AI_MODEL_UNAVAILABLE_CODE,
            },
          });

          return status(422, {
            code: AI_MODEL_UNAVAILABLE_CODE,
            message: error.message,
          });
        }

        throw error;
      }
    },
    {
      body: "ai.SelectModelInput",
      response: {
        200: "ai.Settings",
        422: t.Object({
          code: t.Literal(AI_MODEL_UNAVAILABLE_CODE),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Update selected AI model for the current user",
        tags: ["AI"],
      },
    },
  )
  .patch(
    "/settings/config",
    async ({ db, user, body, status, request }) => {
      try {
        const config = await AiService.updateAiConfiguration(db, user.id, body);
        return status(200, config);
      } catch (error: unknown) {
        if (error instanceof AiForbiddenError) {
          await trackAiHandledError({
            request,
            route: "/ai/settings/config",
            userId: user.id,
            body,
            error,
            metadata: {
              responseStatus: 403,
              reason: AI_FORBIDDEN_CODE,
            },
          });

          return status(403, {
            code: AI_FORBIDDEN_CODE,
            message: ERROR_MESSAGES.AI_CONFIG_UPDATE_FORBIDDEN,
          });
        }
        if (error instanceof ZodError) {
          await trackAiHandledError({
            request,
            route: "/ai/settings/config",
            userId: user.id,
            body,
            error,
            metadata: {
              responseStatus: 422,
              reason: "AI_CONFIG_INVALID_PAYLOAD",
            },
          });

          return status(422, ERROR_MESSAGES.AI_CONFIG_INVALID_PAYLOAD);
        }
        throw error;
      }
    },
    {
      body: "ai.UpdateConfigurationInput",
      response: {
        200: "ai.UpdateConfigurationInput",
        403: "ai.ForbiddenError",
        422: "ai.Error",
      },
      detail: {
        summary: "Update global AI configuration (admin only)",
        tags: ["AI"],
      },
    },
  )
  .post(
    "/optimize",
    async ({ body, set, status, db, user, request }) => {
      const input = body.text.trim();
      const modelId = body.modelId?.trim();
      const trackedRequestContext = {
        request,
        route: "/ai/optimize",
        userId: user.id,
        body,
      } as const;

      if (!input) {
        return status(422, ERROR_MESSAGES.AI_EMPTY_INPUT);
      }

      let optimizationContext: Awaited<ReturnType<typeof AiService.resolveOptimizationContext>>;
      try {
        optimizationContext = await AiService.resolveOptimizationContext(db, user.id, modelId ?? null);
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

          return status(422, error.message);
        }
        throw error;
      }
      const dailyLimit = optimizationContext.config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT;
      let remainingCredits = 0;
      try {
        const consumeResult = await AiService.consumeDailyCredit(db, user.id, dailyLimit);
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

          return status(429, {
            code: AI_CREDITS_EXHAUSTED_CODE,
            message: ERROR_MESSAGES.AI_CREDITS_EXHAUSTED,
          });
        }

        throw error;
      }

      const startedAt = Date.now();
      const usageMetrics = AiService.emptyUsageMetrics();
      let stream: AsyncIterable<unknown>;

      try {
        stream = await AiService.createOptimizeStream(
          input,
          optimizationContext.model.modelId,
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
            modelId: optimizationContext.model.modelId,
            provider: optimizationContext.model.providerName,
          },
        });

        try {
          await AiService.saveOptimization(db, {
            userId: user.id,
            provider: optimizationContext.model.providerName,
            model: optimizationContext.model.modelId,
            promptVersion: optimizationContext.config.PROMPT_VERSION,
            resumeId: body.resumeId?.trim() || null,
            inputText: input,
            optimizedText: "",
            status: "failed",
            durationMs: Date.now() - startedAt,
            chunkCount: 0,
            errorMessage: normalizedError.message,
            usage: usageMetrics,
          });
        } catch (saveError: unknown) {
          const message = saveError instanceof Error ? saveError.message : ERROR_MESSAGES.AI_UNKNOWN_PERSISTENCE_ERROR;
          console.error(`[AI] Failed to persist optimization: ${message}`);
          await trackAiHandledError({
            ...trackedRequestContext,
            error: saveError,
            metadata: {
              phase: "save-optimization-after-create-stream-failure",
              reason: "AI_OPTIMIZATION_PERSISTENCE_ERROR",
            },
          });
        }

        return status(422, {
          code: responseCode,
          message: normalizedError.message,
        });
      }

      set.headers["content-type"] = "text/plain; charset=utf-8";
      set.headers["x-content-type-options"] = "nosniff";
      set.headers["cache-control"] = "no-cache, no-store";
      set.headers["x-ai-credits-remaining"] = String(remainingCredits);

      return (async function* (): AsyncGenerator<string, void, unknown> {
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
              modelId: optimizationContext.model.modelId,
              provider: optimizationContext.model.providerName,
            },
          });
          return;
        } finally {
          if (optimizationStatus === "success" && request.signal.aborted) {
            optimizationStatus = "aborted";
            errorMessage = ERROR_MESSAGES.AI_STREAM_CANCELLED;
          }

          try {
            await AiService.saveOptimization(db, {
              userId: user.id,
              provider: optimizationContext.model.providerName,
              model: optimizationContext.model.modelId,
              promptVersion: optimizationContext.config.PROMPT_VERSION,
              resumeId: body.resumeId?.trim() || null,
              inputText: input,
              optimizedText,
              status: optimizationStatus,
              durationMs: Date.now() - startedAt,
              chunkCount,
              errorMessage,
              usage: usageMetrics,
            });
          } catch (saveError: unknown) {
            const message =
              saveError instanceof Error ? saveError.message : ERROR_MESSAGES.AI_UNKNOWN_PERSISTENCE_ERROR;
            console.error(`[AI] Failed to persist optimization: ${message}`);
            await trackAiHandledError({
              ...trackedRequestContext,
              error: saveError,
              metadata: {
                phase: "save-optimization-finally",
                reason: "AI_OPTIMIZATION_PERSISTENCE_ERROR",
                optimizationStatus,
              },
            });
          }
        }
      })();
    },
    {
      body: "ai.OptimizeInput",
      response: {
        401: t.String({ default: ERROR_MESSAGES.AI_AUTH_REQUIRED }),
        422: t.Union([
          t.String(),
          t.Object({
            code: t.Union([t.Literal(AI_MODEL_POLICY_RESTRICTED_CODE), t.Literal(AI_MODEL_UNAVAILABLE_CODE)]),
            message: t.String(),
          }),
        ]),
        429: t.Object({
          code: t.Literal(AI_CREDITS_EXHAUSTED_CODE),
          message: t.String({ default: ERROR_MESSAGES.AI_CREDITS_EXHAUSTED }),
        }),
      },
      detail: {
        summary: "Optimize text with streamed AI output",
        tags: ["AI"],
      },
    },
  );

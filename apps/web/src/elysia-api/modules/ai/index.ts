import Elysia, { t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { AiModel } from "./model";
import { AI_CREDITS_EXHAUSTED_CODE, AI_CREDITS_EXHAUSTED_MESSAGE, AiCreditsExhaustedError, AiService } from "./service";

const EMPTY_INPUT_ERROR = "Text input cannot be empty.";
const UNAUTHORIZED_ERROR = "Unauthorized - valid session required";
const DEFAULT_ERROR_MESSAGE = "Unknown optimization error";

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
  .post(
    "/optimize",
    async ({ body, set, status, db, user, request }) => {
      const input = body.text.trim();

      if (!input) {
        return status(422, EMPTY_INPUT_ERROR);
      }

      let remainingCredits = 0;
      try {
        const consumeResult = await AiService.consumeDailyCredit(db, user.id);
        remainingCredits = consumeResult.remainingCredits;
      } catch (error: unknown) {
        if (error instanceof AiCreditsExhaustedError) {
          return status(429, {
            code: AI_CREDITS_EXHAUSTED_CODE,
            message: AI_CREDITS_EXHAUSTED_MESSAGE,
          });
        }

        throw error;
      }

      set.headers["content-type"] = "text/plain; charset=utf-8";
      set.headers["x-content-type-options"] = "nosniff";
      set.headers["cache-control"] = "no-cache, no-store";
      set.headers["x-ai-credits-remaining"] = String(remainingCredits);

      return (async function* (): AsyncGenerator<string, void, unknown> {
        const startedAt = Date.now();
        const usageMetrics = AiService.emptyUsageMetrics();
        let optimizedText = "";
        let chunkCount = 0;
        let optimizationStatus: "success" | "failed" | "aborted" = "success";
        let errorMessage: string | null = null;

        try {
          for await (const chunk of AiService.streamOptimizeText(input, {
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
          errorMessage = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
          throw error;
        } finally {
          if (optimizationStatus === "success" && request.signal.aborted) {
            optimizationStatus = "aborted";
            errorMessage = "Client cancelled optimization stream";
          }

          try {
            await AiService.saveOptimization(db, {
              userId: user.id,
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
            const message = saveError instanceof Error ? saveError.message : "Unknown persistence error";
            console.error(`[AI] Failed to persist optimization: ${message}`);
          }
        }
      })();
    },
    {
      body: "ai.OptimizeInput",
      response: {
        401: t.String({ default: UNAUTHORIZED_ERROR }),
        422: t.String(),
        429: t.Object({
          code: t.Literal(AI_CREDITS_EXHAUSTED_CODE),
          message: t.String({ default: AI_CREDITS_EXHAUSTED_MESSAGE }),
        }),
      },
      detail: {
        summary: "Optimize text with streamed AI output",
        tags: ["AI"],
      },
    },
  );

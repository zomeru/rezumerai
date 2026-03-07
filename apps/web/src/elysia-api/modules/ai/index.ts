import { AssistantChatInputSchema } from "@rezumerai/types";
import Elysia, { t } from "elysia";
import { ERROR_MESSAGES } from "@/constants/errors";
import { createAuditLog } from "../../observability/audit";
import { authPlugin, resolveSessionUser } from "../../plugins/auth";
import { trackHandledError } from "../../plugins/error";
import { prismaPlugin } from "../../plugins/prisma";
import {
  AI_ASSISTANT_SESSION_COOKIE_MAX_AGE_SECONDS,
  AI_ASSISTANT_SESSION_COOKIE_NAME,
  readCookieValue,
  serializeCookie,
} from "./assistant-chat";
import { AI_CREDITS_EXHAUSTED_CODE, AI_MODEL_POLICY_RESTRICTED_CODE, AI_MODEL_UNAVAILABLE_CODE } from "./constants";
import { AiModel } from "./model";
import { AiCreditsExhaustedError, AiModelPolicyRestrictedError, AiModelUnavailableError, AiService } from "./service";

interface TrackAiHandledErrorOptions {
  request: Request;
  route: string;
  userId?: string | null;
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
    userId: options.userId ?? undefined,
    metadata: {
      module: "ai",
      route: options.route,
      ...options.metadata,
    },
  });
}

async function trackUnverifiedAiAccess(options: { request: Request; route: string; userId: string }): Promise<void> {
  await trackAiHandledError({
    request: options.request,
    route: options.route,
    userId: options.userId,
    error: new Error(ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED),
    metadata: {
      responseStatus: 403,
      reason: "AI_EMAIL_VERIFICATION_REQUIRED",
    },
  });
}

function resolveUserRole(value: unknown): "ADMIN" | "USER" | null {
  return value === "ADMIN" || value === "USER" ? value : null;
}

function resolveAssistantSession(request: Request): { sessionId: string; setCookie: string | null } {
  const cookieValue = readCookieValue(request.headers.get("cookie"), AI_ASSISTANT_SESSION_COOKIE_NAME);

  if (cookieValue) {
    return {
      sessionId: cookieValue,
      setCookie: null,
    };
  }

  const sessionId = crypto.randomUUID();

  return {
    sessionId,
    setCookie: serializeCookie(AI_ASSISTANT_SESSION_COOKIE_NAME, sessionId, {
      maxAge: AI_ASSISTANT_SESSION_COOKIE_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
    }),
  };
}

async function auditAdminAssistantUsage(options: {
  userId: string;
  reply: string;
  toolNames: string[];
  request: Request;
}): Promise<void> {
  await createAuditLog({
    category: "USER_ACTION",
    eventType: "ADMIN_AI_ASSISTANT_CHAT",
    action: "RUN",
    resourceType: "AI_ASSISTANT",
    userId: options.userId,
    endpoint: new URL(options.request.url).pathname,
    method: options.request.method.toUpperCase(),
    serviceName: "AiService.runAssistantChat",
    requestMetadata: {
      toolNames: options.toolNames,
      replyLength: options.reply.length,
    },
  });
}

export const aiModule = new Elysia({ name: "module/ai", prefix: "/ai" })
  .use(prismaPlugin)
  .use(AiModel)
  .post(
    "/assistant/chat",
    async ({ body, db, status, request, set }) => {
      const parsedInput = AssistantChatInputSchema.safeParse(body);
      if (!parsedInput.success) {
        return status(422, {
          scope: "PUBLIC",
          reply: ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
          blocks: [
            {
              type: "paragraph",
              content: ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
            },
          ],
          toolNames: [],
          usedConversationMemory: false,
          conversationId: null,
        });
      }

      const sessionUser = await resolveSessionUser();
      const role = resolveUserRole((sessionUser as { role?: unknown } | null)?.role);
      const assistantSession = resolveAssistantSession(request);

      if (assistantSession.setCookie) {
        set.headers["set-cookie"] = assistantSession.setCookie;
      }

      try {
        const result = await AiService.runAssistantChat(db, parsedInput.data, {
          userId: sessionUser?.id ?? null,
          role,
          sessionId: assistantSession.sessionId,
        });

        if (role === "ADMIN" && sessionUser?.id) {
          await auditAdminAssistantUsage({
            userId: sessionUser.id,
            reply: result.reply,
            toolNames: result.toolNames,
            request,
          });
        }

        return status(200, result);
      } catch (error: unknown) {
        await trackAiHandledError({
          request,
          route: "/ai/assistant/chat",
          userId: sessionUser?.id ?? null,
          body,
          error,
          metadata: {
            responseStatus: 422,
          },
        });

        return status(422, {
          scope: role ? AiService.toAssistantScope(role) : "PUBLIC",
          reply: ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
          blocks: [
            {
              type: "paragraph",
              content: ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
            },
          ],
          toolNames: [],
          usedConversationMemory: false,
          conversationId: null,
        });
      }
    },
    {
      body: "ai.AssistantChatInput",
      response: {
        200: "ai.AssistantChatResponse",
        422: "ai.AssistantChatResponse",
      },
      detail: {
        summary: "Run the unified AI assistant widget",
        tags: ["AI"],
      },
    },
  )
  .use(authPlugin)
  .get(
    "/models",
    async ({ db, status, request, user }) => {
      if (!user.emailVerified) {
        await trackUnverifiedAiAccess({
          request,
          route: "/ai/models",
          userId: user.id,
        });
        return status(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
      }

      const models = await AiService.listActiveModels(db);
      return status(200, models);
    },
    {
      response: {
        200: "ai.ModelOptionList",
        403: "ai.Error",
      },
      detail: {
        summary: "List all active AI models",
        tags: ["AI"],
      },
    },
  )
  .get(
    "/settings",
    async ({ db, user, status, request }) => {
      if (!user.emailVerified) {
        await trackUnverifiedAiAccess({
          request,
          route: "/ai/settings",
          userId: user.id,
        });
        return status(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
      }

      const settings = await AiService.getUserAiSettings(db, user.id);
      return status(200, settings);
    },
    {
      response: {
        200: "ai.Settings",
        403: "ai.Error",
      },
      detail: {
        summary: "Fetch active AI models and the current user's default selection",
        tags: ["AI"],
      },
    },
  )
  .patch(
    "/settings/model",
    async ({ db, user, body, status, request }) => {
      if (!user.emailVerified) {
        await trackUnverifiedAiAccess({
          request,
          route: "/ai/settings/model",
          userId: user.id,
        });
        return status(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
      }

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
        403: "ai.Error",
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
  .post(
    "/copilot/optimize-section",
    async ({ body, db, user, status, request }) => {
      if (!user.emailVerified) {
        await trackUnverifiedAiAccess({
          request,
          route: "/ai/copilot/optimize-section",
          userId: user.id,
        });
        return status(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
      }

      const startedAt = Date.now();
      let runtime = null as Awaited<ReturnType<typeof AiService.resolveOptimizationContext>> | null;

      try {
        runtime = await AiService.resolveOptimizationContext(db, user.id, null);
        const result = await AiService.runCopilotOptimize(db, user.id, {
          ...body,
          intent: body.intent ?? "clarity",
        });

        await AiService.saveCopilotResult(
          db,
          user.id,
          body.resumeId,
          "optimize",
          result.response.modelId,
          result.promptVersion,
          body,
          result.response,
          result.usage,
          Date.now() - startedAt,
        );

        return status(200, result.response);
      } catch (error: unknown) {
        const normalizedError = error instanceof Error ? error : new Error(ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
        await trackAiHandledError({
          request,
          route: "/ai/copilot/optimize-section",
          userId: user.id,
          body,
          error: normalizedError,
          metadata: {
            responseStatus:
              error instanceof AiCreditsExhaustedError ? 429 : error instanceof AiModelUnavailableError ? 422 : 500,
          },
        });

        if (runtime) {
          await AiService.saveCopilotFailure(
            db,
            user.id,
            body.resumeId,
            "optimize",
            runtime.model.modelId,
            runtime.config.PROMPT_VERSION,
            body,
            normalizedError.message,
            Date.now() - startedAt,
          );
        }

        if (error instanceof AiCreditsExhaustedError) {
          return status(429, ERROR_MESSAGES.AI_CREDITS_EXHAUSTED);
        }

        if (error instanceof AiModelUnavailableError || error instanceof AiModelPolicyRestrictedError) {
          return status(422, normalizedError.message);
        }

        return status(500, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
      }
    },
    {
      body: "ai.CopilotOptimizeInput",
      response: {
        200: "ai.CopilotOptimizeResponse",
        403: "ai.Error",
        422: "ai.Error",
        429: "ai.Error",
        500: "ai.Error",
      },
      detail: {
        summary: "Optimize a resume section with Resume Copilot",
        tags: ["AI", "Resume Copilot"],
      },
    },
  )
  .post(
    "/copilot/tailor",
    async ({ body, db, user, status, request }) => {
      if (!user.emailVerified) {
        await trackUnverifiedAiAccess({
          request,
          route: "/ai/copilot/tailor",
          userId: user.id,
        });
        return status(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
      }

      const startedAt = Date.now();
      let runtime = null as Awaited<ReturnType<typeof AiService.resolveOptimizationContext>> | null;

      try {
        runtime = await AiService.resolveOptimizationContext(db, user.id, null);
        const result = await AiService.runCopilotTailor(db, user.id, body);

        await AiService.saveCopilotResult(
          db,
          user.id,
          body.resumeId,
          "tailor",
          result.response.modelId,
          result.promptVersion,
          body,
          result.response,
          result.usage,
          Date.now() - startedAt,
        );

        return status(200, result.response);
      } catch (error: unknown) {
        const normalizedError = error instanceof Error ? error : new Error(ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
        await trackAiHandledError({
          request,
          route: "/ai/copilot/tailor",
          userId: user.id,
          body,
          error: normalizedError,
        });

        if (runtime) {
          await AiService.saveCopilotFailure(
            db,
            user.id,
            body.resumeId,
            "tailor",
            runtime.model.modelId,
            runtime.config.PROMPT_VERSION,
            body,
            normalizedError.message,
            Date.now() - startedAt,
          );
        }

        if (error instanceof AiCreditsExhaustedError) {
          return status(429, ERROR_MESSAGES.AI_CREDITS_EXHAUSTED);
        }

        if (error instanceof AiModelUnavailableError || error instanceof AiModelPolicyRestrictedError) {
          return status(422, normalizedError.message);
        }

        return status(500, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
      }
    },
    {
      body: "ai.CopilotTailorInput",
      response: {
        200: "ai.CopilotTailorResponse",
        403: "ai.Error",
        422: "ai.Error",
        429: "ai.Error",
        500: "ai.Error",
      },
      detail: {
        summary: "Tailor a resume to a job description",
        tags: ["AI", "Resume Copilot"],
      },
    },
  )
  .post(
    "/copilot/review",
    async ({ body, db, user, status, request }) => {
      if (!user.emailVerified) {
        await trackUnverifiedAiAccess({
          request,
          route: "/ai/copilot/review",
          userId: user.id,
        });
        return status(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
      }

      const startedAt = Date.now();
      let runtime = null as Awaited<ReturnType<typeof AiService.resolveOptimizationContext>> | null;

      try {
        runtime = await AiService.resolveOptimizationContext(db, user.id, null);
        const result = await AiService.runCopilotReview(db, user.id, body);

        await AiService.saveCopilotResult(
          db,
          user.id,
          body.resumeId,
          "review",
          result.response.modelId,
          result.promptVersion,
          body,
          result.response,
          result.usage,
          Date.now() - startedAt,
        );

        return status(200, result.response);
      } catch (error: unknown) {
        const normalizedError = error instanceof Error ? error : new Error(ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
        await trackAiHandledError({
          request,
          route: "/ai/copilot/review",
          userId: user.id,
          body,
          error: normalizedError,
        });

        if (runtime) {
          await AiService.saveCopilotFailure(
            db,
            user.id,
            body.resumeId,
            "review",
            runtime.model.modelId,
            runtime.config.PROMPT_VERSION,
            body,
            normalizedError.message,
            Date.now() - startedAt,
          );
        }

        if (error instanceof AiCreditsExhaustedError) {
          return status(429, ERROR_MESSAGES.AI_CREDITS_EXHAUSTED);
        }

        if (error instanceof AiModelUnavailableError || error instanceof AiModelPolicyRestrictedError) {
          return status(422, normalizedError.message);
        }

        return status(500, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
      }
    },
    {
      body: "ai.CopilotReviewInput",
      response: {
        200: "ai.CopilotReviewResponse",
        403: "ai.Error",
        422: "ai.Error",
        429: "ai.Error",
        500: "ai.Error",
      },
      detail: {
        summary: "Review overall resume quality",
        tags: ["AI", "Resume Copilot"],
      },
    },
  )
  .post(
    "/optimize",
    async ({ body, set, status, db, user, request }) => {
      if (!user.emailVerified) {
        await trackUnverifiedAiAccess({
          request,
          route: "/ai/optimize",
          userId: user.id,
        });
        return status(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
      }

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
          }
        }
      })();
    },
    {
      body: "ai.OptimizeInput",
      response: {
        401: t.String({ default: ERROR_MESSAGES.AI_AUTH_REQUIRED }),
        403: t.String({ default: ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED }),
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

import type { PrismaClient } from "@rezumerai/database";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;

import type {
  AssistantChatResponse,
  ResumeCopilotOptimizeResponse,
  ResumeCopilotReviewResponse,
  ResumeCopilotTailorResponse,
} from "@rezumerai/types";
import { AssistantChatInputSchema } from "@rezumerai/types";
import { ERROR_MESSAGES } from "@/constants/errors";
import { createAuditLog } from "../../observability/audit";
import { resolveSessionUser } from "../../plugins/auth";
import { trackHandledError } from "../../plugins/error";
import {
  AI_ASSISTANT_SESSION_COOKIE_MAX_AGE_SECONDS,
  AI_ASSISTANT_SESSION_COOKIE_NAME,
  readCookieValue,
  serializeCookie,
} from "./assistant-chat";
import { AI_CREDITS_EXHAUSTED_CODE, AI_MODEL_POLICY_RESTRICTED_CODE, AI_MODEL_UNAVAILABLE_CODE } from "./constants";
import { AiCreditsExhaustedError, AiModelPolicyRestrictedError, AiModelUnavailableError, AiService } from "./service";
import type { ActiveAiModel, CopilotRunResult, OptimizationContext, UserAiSettings } from "./types";

type RouteHeaders = Record<string, string>;
type StatusMap = Record<number, unknown>;

export type RouteResult<TCases extends StatusMap> = {
  [TStatus in keyof TCases & number]: {
    status: TStatus;
    body: TCases[TStatus];
    headers?: RouteHeaders;
  };
}[keyof TCases & number];

function routeResult<TStatus extends number, TBody>(
  status: TStatus,
  body: TBody,
  headers?: RouteHeaders,
): {
  status: TStatus;
  body: TBody;
  headers?: RouteHeaders;
} {
  return headers ? { status, body, headers } : { status, body };
}

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

interface VerifiedAiUser {
  id: string;
  emailVerified: boolean;
}

interface SelectModelBody {
  modelId: string;
}

interface OptimizeTextBody {
  text: string;
  resumeId?: string;
  modelId?: string;
}

function buildAssistantFailureResponse(scope: AssistantChatResponse["scope"]): AssistantChatResponse {
  return {
    scope,
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
  };
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

async function ensureVerifiedAiUser(options: {
  request: Request;
  route: string;
  user: VerifiedAiUser;
}): Promise<RouteResult<{ 403: string }> | null> {
  if (options.user.emailVerified) {
    return null;
  }

  await trackUnverifiedAiAccess({
    request: options.request,
    route: options.route,
    userId: options.user.id,
  });

  return routeResult(403, ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
}

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

async function runCopilotRequest<TInput extends { resumeId: string }, TResponse extends { modelId: string }>(options: {
  db: TransactionCapableDatabaseClient;
  request: Request;
  route: string;
  userId: string;
  body: TInput;
  operation: "optimize" | "tailor" | "review";
  run: (db: TransactionCapableDatabaseClient, userId: string, body: TInput) => Promise<CopilotRunResult<TResponse>>;
}): Promise<RouteResult<{ 200: TResponse; 422: string; 429: string; 500: string }>> {
  const startedAt = Date.now();
  let runtime: OptimizationContext | null = null;

  try {
    runtime = await AiService.resolveOptimizationContext(options.db, options.userId, null);
    const result = await options.run(options.db, options.userId, options.body);

    await AiService.saveCopilotResult(
      options.db,
      options.userId,
      options.body.resumeId,
      options.operation,
      result.response.modelId,
      result.promptVersion,
      options.body,
      result.response,
      result.usage,
      Date.now() - startedAt,
    );

    return routeResult(200, result.response);
  } catch (error: unknown) {
    const normalizedError = error instanceof Error ? error : new Error(ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);

    await trackAiHandledError({
      request: options.request,
      route: options.route,
      userId: options.userId,
      body: options.body,
      error: normalizedError,
      metadata: {
        responseStatus:
          error instanceof AiCreditsExhaustedError ? 429 : error instanceof AiModelUnavailableError ? 422 : 500,
      },
    });

    if (runtime) {
      await AiService.saveCopilotFailure(
        options.db,
        options.userId,
        options.body.resumeId,
        options.operation,
        runtime.model.modelId,
        runtime.config.PROMPT_VERSION,
        options.body,
        normalizedError.message,
        Date.now() - startedAt,
      );
    }

    if (error instanceof AiCreditsExhaustedError) {
      return routeResult(429, ERROR_MESSAGES.AI_CREDITS_EXHAUSTED);
    }

    if (error instanceof AiModelUnavailableError || error instanceof AiModelPolicyRestrictedError) {
      return routeResult(422, normalizedError.message);
    }

    return routeResult(500, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
  }
}

export async function handleAssistantChatRequest(options: {
  body: unknown;
  db: TransactionCapableDatabaseClient;
  request: Request;
}): Promise<RouteResult<{ 200: AssistantChatResponse; 422: AssistantChatResponse }>> {
  const parsedInput = AssistantChatInputSchema.safeParse(options.body);

  if (!parsedInput.success) {
    return routeResult(422, buildAssistantFailureResponse("PUBLIC"));
  }

  const sessionUser = await resolveSessionUser();
  const role = resolveUserRole(sessionUser?.role);
  const assistantSession = resolveAssistantSession(options.request);

  try {
    const result = await AiService.runAssistantChat(options.db, parsedInput.data, {
      userId: sessionUser?.id ?? null,
      role,
      sessionId: assistantSession.sessionId,
    });

    if (role === "ADMIN" && sessionUser?.id) {
      await auditAdminAssistantUsage({
        userId: sessionUser.id,
        reply: result.reply,
        toolNames: result.toolNames,
        request: options.request,
      });
    }

    return routeResult(
      200,
      result,
      assistantSession.setCookie ? { "set-cookie": assistantSession.setCookie } : undefined,
    );
  } catch (error: unknown) {
    await trackAiHandledError({
      request: options.request,
      route: "/ai/assistant/chat",
      userId: sessionUser?.id ?? null,
      body: options.body,
      error,
      metadata: {
        responseStatus: 422,
      },
    });

    return routeResult(
      422,
      buildAssistantFailureResponse(role ? AiService.toAssistantScope(role) : "PUBLIC"),
      assistantSession.setCookie ? { "set-cookie": assistantSession.setCookie } : undefined,
    );
  }
}

export async function handleListModelsRequest(options: {
  db: TransactionCapableDatabaseClient;
  request: Request;
  user: VerifiedAiUser;
}): Promise<RouteResult<{ 200: ActiveAiModel[]; 403: string }>> {
  const verificationResult = await ensureVerifiedAiUser({
    request: options.request,
    route: "/ai/models",
    user: options.user,
  });

  if (verificationResult) {
    return verificationResult;
  }

  return routeResult(200, await AiService.listActiveModels(options.db));
}

export async function handleGetSettingsRequest(options: {
  db: TransactionCapableDatabaseClient;
  request: Request;
  user: VerifiedAiUser;
}): Promise<RouteResult<{ 200: UserAiSettings; 403: string }>> {
  const verificationResult = await ensureVerifiedAiUser({
    request: options.request,
    route: "/ai/settings",
    user: options.user,
  });

  if (verificationResult) {
    return verificationResult;
  }

  return routeResult(200, await AiService.getUserAiSettings(options.db, options.user.id));
}

export async function handleUpdateSelectedModelRequest(options: {
  body: SelectModelBody;
  db: TransactionCapableDatabaseClient;
  request: Request;
  user: VerifiedAiUser;
}): Promise<
  RouteResult<{
    200: UserAiSettings;
    403: string;
    422: { code: typeof AI_MODEL_UNAVAILABLE_CODE; message: string };
  }>
> {
  const verificationResult = await ensureVerifiedAiUser({
    request: options.request,
    route: "/ai/settings/model",
    user: options.user,
  });

  if (verificationResult) {
    return verificationResult;
  }

  try {
    await AiService.updateUserSelectedModel(options.db, options.user.id, options.body.modelId.trim());

    return routeResult(200, await AiService.getUserAiSettings(options.db, options.user.id));
  } catch (error: unknown) {
    if (error instanceof AiModelUnavailableError) {
      await trackAiHandledError({
        request: options.request,
        route: "/ai/settings/model",
        userId: options.user.id,
        body: options.body,
        error,
        metadata: {
          responseStatus: 422,
          reason: AI_MODEL_UNAVAILABLE_CODE,
        },
      });

      const unavailableBody = {
        code: AI_MODEL_UNAVAILABLE_CODE,
        message: error.message,
      } satisfies {
        code: typeof AI_MODEL_UNAVAILABLE_CODE;
        message: string;
      };

      return routeResult(422, unavailableBody);
    }

    throw error;
  }
}

export async function handleCopilotOptimizeRequest(options: {
  body: {
    resumeId: Parameters<typeof AiService.runCopilotOptimize>[2]["resumeId"];
    target: Parameters<typeof AiService.runCopilotOptimize>[2]["target"];
    intent?: Parameters<typeof AiService.runCopilotOptimize>[2]["intent"];
  };
  db: TransactionCapableDatabaseClient;
  request: Request;
  user: VerifiedAiUser;
}): Promise<RouteResult<{ 200: ResumeCopilotOptimizeResponse; 403: string; 422: string; 429: string; 500: string }>> {
  const verificationResult = await ensureVerifiedAiUser({
    request: options.request,
    route: "/ai/copilot/optimize-section",
    user: options.user,
  });

  if (verificationResult) {
    return verificationResult;
  }

  return runCopilotRequest({
    db: options.db,
    request: options.request,
    route: "/ai/copilot/optimize-section",
    userId: options.user.id,
    body: {
      ...options.body,
      intent: options.body.intent ?? "clarity",
    },
    operation: "optimize",
    run: AiService.runCopilotOptimize,
  });
}

export async function handleCopilotTailorRequest(options: {
  body: Parameters<typeof AiService.runCopilotTailor>[2];
  db: TransactionCapableDatabaseClient;
  request: Request;
  user: VerifiedAiUser;
}): Promise<RouteResult<{ 200: ResumeCopilotTailorResponse; 403: string; 422: string; 429: string; 500: string }>> {
  const verificationResult = await ensureVerifiedAiUser({
    request: options.request,
    route: "/ai/copilot/tailor",
    user: options.user,
  });

  if (verificationResult) {
    return verificationResult;
  }

  return runCopilotRequest({
    db: options.db,
    request: options.request,
    route: "/ai/copilot/tailor",
    userId: options.user.id,
    body: options.body,
    operation: "tailor",
    run: AiService.runCopilotTailor,
  });
}

export async function handleCopilotReviewRequest(options: {
  body: Parameters<typeof AiService.runCopilotReview>[2];
  db: TransactionCapableDatabaseClient;
  request: Request;
  user: VerifiedAiUser;
}): Promise<RouteResult<{ 200: ResumeCopilotReviewResponse; 403: string; 422: string; 429: string; 500: string }>> {
  const verificationResult = await ensureVerifiedAiUser({
    request: options.request,
    route: "/ai/copilot/review",
    user: options.user,
  });

  if (verificationResult) {
    return verificationResult;
  }

  return runCopilotRequest({
    db: options.db,
    request: options.request,
    route: "/ai/copilot/review",
    userId: options.user.id,
    body: options.body,
    operation: "review",
    run: AiService.runCopilotReview,
  });
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

  const input = options.body.text.trim();
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

    await persistOptimizationSafely(options.db, {
      userId: options.user.id,
      provider: optimizationContext.model.providerName,
      model: optimizationContext.model.modelId,
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
            modelId: optimizationContext.model.modelId,
            provider: optimizationContext.model.providerName,
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
          provider: optimizationContext.model.providerName,
          model: optimizationContext.model.modelId,
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

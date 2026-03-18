import type {
  ResumeCopilotOptimizeResponse,
  ResumeCopilotReviewResponse,
  ResumeCopilotTailorResponse,
} from "@rezumerai/types";
import { ERROR_MESSAGES } from "@/constants/errors";
import {
  AiCreditsExhaustedError,
  AiModelPolicyRestrictedError,
  AiModelUnavailableError,
  AiProviderCircuitBreakerError,
  AiService,
} from "../service";
import type { CopilotRunResult, OptimizationContext } from "../types";
import { ensureVerifiedAiUser, routeResult, trackAiHandledError } from "./helpers";
import type { RouteResult, TransactionCapableDatabaseClient, VerifiedAiUser } from "./types";

async function runCopilotRequest<TInput extends { resumeId: string }, TResponse extends { modelId: string }>(options: {
  db: TransactionCapableDatabaseClient;
  request: Request;
  route: string;
  userId: string;
  body: TInput;
  operation: "optimize" | "tailor" | "review";
  run: (db: TransactionCapableDatabaseClient, userId: string, body: TInput) => Promise<CopilotRunResult<TResponse>>;
}): Promise<RouteResult<{ 200: TResponse; 422: string; 429: string; 500: string; 503: string }>> {
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
          error instanceof AiCreditsExhaustedError
            ? 429
            : error instanceof AiModelUnavailableError || error instanceof AiModelPolicyRestrictedError
              ? 422
              : error instanceof AiProviderCircuitBreakerError
                ? 503
                : 500,
      },
    });

    if (runtime) {
      await AiService.saveCopilotFailure(
        options.db,
        options.userId,
        options.body.resumeId,
        options.operation,
        runtime.model.id,
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

    if (error instanceof AiProviderCircuitBreakerError) {
      return routeResult(503, ERROR_MESSAGES.AI_PROVIDER_UNAVAILABLE);
    }

    return routeResult(500, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
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
}): Promise<
  RouteResult<{ 200: ResumeCopilotOptimizeResponse; 403: string; 422: string; 429: string; 500: string; 503: string }>
> {
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
}): Promise<
  RouteResult<{ 200: ResumeCopilotTailorResponse; 403: string; 422: string; 429: string; 500: string; 503: string }>
> {
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
}): Promise<
  RouteResult<{ 200: ResumeCopilotReviewResponse; 403: string; 422: string; 429: string; 500: string; 503: string }>
> {
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

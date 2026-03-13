import { AI_MODEL_UNAVAILABLE_CODE } from "../constants";
import { AiModelUnavailableError, AiService } from "../service";
import type { ActiveAiModel, UserAiSettings } from "../types";
import { ensureVerifiedAiUser, routeResult, trackAiHandledError } from "./helpers";
import type { RouteResult, SelectModelBody, TransactionCapableDatabaseClient, VerifiedAiUser } from "./types";

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

  return routeResult(200, await AiService.getAvailableModels());
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

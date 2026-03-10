import { ERROR_MESSAGES } from "@/constants/errors";
import { trackHandledError } from "../../../../plugins/error";
import type { TrackAiHandledErrorOptions } from "../types";

export async function trackAiHandledError(options: TrackAiHandledErrorOptions): Promise<void> {
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

export async function trackUnverifiedAiAccess(options: {
  request: Request;
  route: string;
  userId: string;
}): Promise<void> {
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

export async function trackAnonymousAiAccess(options: {
  request: Request;
  route: string;
  userId: string;
}): Promise<void> {
  await trackAiHandledError({
    request: options.request,
    route: options.route,
    userId: options.userId,
    error: new Error(ERROR_MESSAGES.AI_AUTH_REQUIRED),
    metadata: {
      responseStatus: 403,
      reason: "AI_AUTH_REQUIRED",
    },
  });
}

import type { AssistantChatResponse } from "@rezumerai/types";
import { getAiFeatureAccessMessage } from "@/lib/ai-access";
import { AiService } from "../../service";
import type { RouteResult, VerifiedAiUser } from "../types";
import { trackAnonymousAiAccess, trackUnverifiedAiAccess } from "./error-tracking";
import { routeResult } from "./route-result";

export function resolveUserRole(value: unknown): "ADMIN" | "USER" | null {
  return value === "ADMIN" || value === "USER" ? value : null;
}

export function resolveAssistantIdentity(options: {
  user: VerifiedAiUser;
  role: "ADMIN" | "USER" | null;
  isAnonymous: boolean;
}): {
  userId: string;
  role: "ADMIN" | "USER" | null;
  isAnonymous: boolean;
} {
  return {
    userId: options.user.id,
    role: options.role,
    isAnonymous: options.isAnonymous,
  };
}

export function getAssistantScopeFromRole(
  role: "ADMIN" | "USER" | null,
  isAnonymous = false,
): AssistantChatResponse["scope"] {
  return role ? AiService.toAssistantScope(role, isAnonymous) : "PUBLIC";
}

export async function ensureVerifiedAiUser(options: {
  request: Request;
  route: string;
  user: VerifiedAiUser;
}): Promise<RouteResult<{ 403: string }> | null> {
  const accessMessage = getAiFeatureAccessMessage({
    isAnonymous: options.user.isAnonymous,
    emailVerified: options.user.emailVerified,
  });

  if (!accessMessage) {
    return null;
  }

  if (options.user.isAnonymous) {
    await trackAnonymousAiAccess({
      request: options.request,
      route: options.route,
      userId: options.user.id,
    });
  } else {
    await trackUnverifiedAiAccess({
      request: options.request,
      route: options.route,
      userId: options.user.id,
    });
  }

  return routeResult(403, accessMessage);
}

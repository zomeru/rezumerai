import type { AssistantRoleScope } from "@rezumerai/types";
import { ASSISTANT_ACCESS_DENIED_REPLY, ASSISTANT_SIGN_IN_REPLY } from "../constants";
import {
  classifyAssistantIntent,
  isAdminAnalyticsRequest,
  isAdminAuditRequest,
  isAdminConfigurationRequest,
  isAdminErrorRequest,
  isAdminUsersRequest,
  isPublicAboutRequest,
  isPublicContactRequest,
  isPublicFaqRequest,
  isPublicPrivacyRequest,
  isPublicTermsRequest,
  isUserCreditsRequest,
  isUserDraftRequest,
  isUserModelRequest,
  isUserResumeRequest,
} from "../intent";
import type { AssistantExecutionStrategy, AssistantToolName } from "../types";
import { clampRequestedLimit } from "../utils";

function extractRequestedLimit(message: string): number | null {
  if (/\b(all|every)\b/i.test(message)) {
    return 100;
  }

  const limitMatch = message.match(/\b(\d{1,3})\b/);
  if (!limitMatch) {
    return null;
  }

  const parsed = Number.parseInt(limitMatch[1] ?? "", 10);
  return Number.isNaN(parsed) ? null : clampRequestedLimit(parsed, 5);
}

function resolvePublicToolName(message: string): AssistantToolName {
  const normalized = message.trim().toLowerCase();

  if (isPublicPrivacyRequest(normalized)) {
    return "getPublicPrivacyPolicy";
  }

  if (isPublicTermsRequest(normalized)) {
    return "getPublicTermsOfService";
  }

  if (isPublicFaqRequest(normalized) || /\bhow does resume copilot work\b/.test(normalized)) {
    return "getPublicFaq";
  }

  if (isPublicAboutRequest(normalized)) {
    return "getPublicAboutPage";
  }

  if (isPublicContactRequest(normalized)) {
    return "getPublicContactPage";
  }

  return "getPublicAppOverview";
}

function resolveUserToolName(message: string): AssistantToolName | null {
  const normalized = message.trim().toLowerCase();

  if (isUserResumeRequest(normalized)) {
    return "listMyRecentResumes";
  }

  if (isUserDraftRequest(normalized)) {
    return "listMyRecentDrafts";
  }

  if (isUserCreditsRequest(normalized)) {
    return "getMyOptimizationCredits";
  }

  if (isUserModelRequest(normalized)) {
    return "getMyCurrentModelSettings";
  }

  return null;
}

function resolveAdminToolName(message: string): AssistantToolName | null {
  const normalized = message.trim().toLowerCase();

  if (isAdminConfigurationRequest(normalized)) {
    return "getAiConfiguration";
  }

  if (isAdminErrorRequest(normalized)) {
    return "listRecentErrorLogs";
  }

  if (isAdminAuditRequest(normalized)) {
    return "listRecentAuditLogs";
  }

  if (isAdminAnalyticsRequest(normalized)) {
    return "getAnalyticsSummary";
  }

  if (isAdminUsersRequest(normalized)) {
    return "listRegisteredUsers";
  }

  return null;
}

export function resolveAssistantExecutionStrategy(options: {
  message: string;
  scope: AssistantRoleScope;
  userId: string | null;
}): AssistantExecutionStrategy {
  const { message, scope, userId } = options;
  const requestedLimit = extractRequestedLimit(message);
  const classification = classifyAssistantIntent(message);

  if (classification.category === "user_private" && !userId) {
    return {
      mode: "sign-in-required",
      classification,
      reply: ASSISTANT_SIGN_IN_REPLY,
      requestedLimit,
    };
  }

  if (classification.category === "admin_private" && scope !== "ADMIN") {
    return {
      mode: "access-denied",
      classification,
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit,
    };
  }

  if (classification.category === "public") {
    return {
      mode: "forced-tool",
      classification,
      toolName: resolvePublicToolName(message),
      requestedLimit,
    };
  }

  if (classification.category === "user_private") {
    const toolName = resolveUserToolName(message);

    return {
      mode: "forced-tool",
      classification,
      toolName: toolName ?? "listMyRecentResumes",
      requestedLimit,
    };
  }

  if (classification.category === "admin_private") {
    const toolName = resolveAdminToolName(message);

    return {
      mode: "forced-tool",
      classification,
      toolName: toolName ?? "getAiConfiguration",
      requestedLimit,
    };
  }

  return {
    mode: "model",
    classification,
    requestedLimit,
  };
}

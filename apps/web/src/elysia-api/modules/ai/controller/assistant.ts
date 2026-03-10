import {
  AssistantChatInputSchema,
  type AssistantChatResponse,
  AssistantHistoryQuerySchema,
  type AssistantHistoryResponse,
} from "@rezumerai/types";
import { ERROR_MESSAGES } from "@/constants/errors";
import { resolveSessionUser } from "../../../plugins/auth";
import { AiService } from "../service";
import {
  auditAdminAssistantUsage,
  getAssistantScopeFromRole,
  resolveAssistantIdentity,
  resolveUserRole,
  routeResult,
  trackAiHandledError,
} from "./helpers";
import type { RouteResult, TransactionCapableDatabaseClient } from "./types";

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
  };
}

function buildEmptyAssistantHistoryResponse(scope: AssistantChatResponse["scope"]): AssistantHistoryResponse {
  return {
    scope,
    messages: [],
    nextCursor: null,
    hasMore: false,
  };
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

  if (!sessionUser) {
    return routeResult(422, buildAssistantFailureResponse("PUBLIC"));
  }

  const identity = resolveAssistantIdentity({
    user: sessionUser,
    role,
    isAnonymous: sessionUser.isAnonymous === true,
  });

  try {
    const result = await AiService.runAssistantChat(options.db, parsedInput.data, identity);

    if (role === "ADMIN" && sessionUser?.id) {
      await auditAdminAssistantUsage({
        userId: sessionUser.id,
        reply: result.reply,
        toolNames: result.toolNames,
        request: options.request,
      });
    }

    return routeResult(200, result);
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
      buildAssistantFailureResponse(getAssistantScopeFromRole(role, sessionUser.isAnonymous === true)),
    );
  }
}

export async function handleAssistantHistoryRequest(options: {
  db: TransactionCapableDatabaseClient;
  query: unknown;
  request: Request;
}): Promise<RouteResult<{ 200: AssistantHistoryResponse; 422: AssistantHistoryResponse }>> {
  const parsedQuery = AssistantHistoryQuerySchema.safeParse(options.query);
  const sessionUser = await resolveSessionUser();
  const role = resolveUserRole(sessionUser?.role);
  const scope = getAssistantScopeFromRole(role, sessionUser?.isAnonymous === true);

  if (!parsedQuery.success) {
    return routeResult(422, buildEmptyAssistantHistoryResponse(scope));
  }

  if (!sessionUser) {
    return routeResult(422, buildEmptyAssistantHistoryResponse("PUBLIC"));
  }

  const identity = resolveAssistantIdentity({
    user: sessionUser,
    role,
    isAnonymous: sessionUser.isAnonymous === true,
  });

  try {
    return routeResult(200, await AiService.getAssistantHistory(options.db, identity, parsedQuery.data));
  } catch (error: unknown) {
    await trackAiHandledError({
      request: options.request,
      route: "/ai/assistant/history",
      userId: sessionUser?.id ?? null,
      query: options.query,
      error,
      metadata: {
        responseStatus: 422,
      },
    });

    return routeResult(422, buildEmptyAssistantHistoryResponse(scope));
  }
}

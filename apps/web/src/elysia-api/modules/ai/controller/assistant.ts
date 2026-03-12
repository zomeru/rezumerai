import { AssistantHistoryQuerySchema, type AssistantRoleScope } from "@rezumerai/types";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import { resolveSessionUser } from "../../../plugins/auth";
import { AiService } from "../service";
import type { AssistantUiMessage } from "../ui-message";
import {
  getAssistantScopeFromRole,
  resolveAssistantIdentity,
  resolveUserRole,
  routeResult,
  trackAiHandledError,
} from "./helpers";
import type { RouteResult, TransactionCapableDatabaseClient } from "./types";

const AssistantStreamInputSchema = z.object({
  id: z.string().trim().min(1).max(120),
  message: z
    .object({
      id: z.string().trim().min(1).max(200),
      role: z.literal("user"),
      parts: z.array(z.unknown()).min(1),
    })
    .transform((value) => value as AssistantUiMessage),
  currentPath: z.string().trim().max(200).optional(),
});

export interface AssistantMessagesResponse {
  scope: AssistantRoleScope;
  messages: AssistantUiMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

function buildAssistantMessagesFailureResponse(scope: AssistantRoleScope): AssistantMessagesResponse {
  return {
    scope,
    messages: [],
    nextCursor: null,
    hasMore: false,
  };
}

export async function handleAssistantChatStreamRequest(options: {
  body: unknown;
  db: TransactionCapableDatabaseClient;
  request: Request;
}): Promise<Response> {
  const parsedInput = AssistantStreamInputSchema.safeParse(options.body);

  if (!parsedInput.success) {
    return new Response(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR, { status: 422 });
  }

  const sessionUser = await resolveSessionUser(options.request.headers);
  const role = resolveUserRole(sessionUser?.role);

  if (!sessionUser) {
    return new Response(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR, { status: 422 });
  }

  const identity = resolveAssistantIdentity({
    user: sessionUser,
    role,
    isAnonymous: sessionUser.isAnonymous === true,
  });

  try {
    return await AiService.streamAssistantChat(
      options.db,
      {
        threadId: parsedInput.data.id,
        message: parsedInput.data.message,
        currentPath: parsedInput.data.currentPath,
      },
      identity,
      options.request,
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

    return new Response(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR, { status: 422 });
  }
}

export async function handleAssistantMessagesRequest(options: {
  db: TransactionCapableDatabaseClient;
  query: unknown;
  request: Request;
}): Promise<RouteResult<{ 200: AssistantMessagesResponse; 422: AssistantMessagesResponse }>> {
  const parsedQuery = AssistantHistoryQuerySchema.safeParse(options.query);
  const sessionUser = await resolveSessionUser(options.request.headers);
  const role = resolveUserRole(sessionUser?.role);
  const scope = getAssistantScopeFromRole(role, sessionUser?.isAnonymous === true);

  if (!parsedQuery.success) {
    return routeResult(422, buildAssistantMessagesFailureResponse(scope));
  }

  if (!sessionUser) {
    return routeResult(422, buildAssistantMessagesFailureResponse("PUBLIC"));
  }

  const identity = resolveAssistantIdentity({
    user: sessionUser,
    role,
    isAnonymous: sessionUser.isAnonymous === true,
  });

  try {
    return routeResult(200, await AiService.getAssistantMessages(options.db, identity, parsedQuery.data));
  } catch (error: unknown) {
    await trackAiHandledError({
      request: options.request,
      route: "/ai/assistant/messages",
      userId: sessionUser?.id ?? null,
      query: options.query,
      error,
      metadata: {
        responseStatus: 422,
      },
    });

    return routeResult(422, buildAssistantMessagesFailureResponse(scope));
  }
}

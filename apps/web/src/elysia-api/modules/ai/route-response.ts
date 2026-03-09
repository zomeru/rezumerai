import type { AssistantChatResponse } from "@rezumerai/types";
import type {
  AI_CREDITS_EXHAUSTED_CODE,
  AI_MODEL_POLICY_RESTRICTED_CODE,
  AI_MODEL_UNAVAILABLE_CODE,
} from "./constants";
import type { RouteResult } from "./controller";
import type { UserAiSettings } from "./types";

type AssistantChatRouteResult = RouteResult<{ 200: AssistantChatResponse; 422: AssistantChatResponse }>;
type OkOrForbiddenRouteResult<TBody> = RouteResult<{ 200: TBody; 403: string }>;
type CopilotRouteResult<TBody> = RouteResult<{ 200: TBody; 403: string; 422: string; 429: string; 500: string }>;
type UpdateSelectedModelRouteResult = RouteResult<{
  200: UserAiSettings;
  403: string;
  422: {
    code: typeof AI_MODEL_UNAVAILABLE_CODE;
    message: string;
  };
}>;
type OptimizeTextRouteResult = RouteResult<{
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
}>;

function assertNever(value: never): never {
  throw new Error(`Unhandled AI route response: ${JSON.stringify(value)}`);
}

export function applyResponseHeaders(
  target: Record<string, string | number | undefined>,
  headers?: Record<string, string>,
): void {
  if (!headers) {
    return;
  }

  for (const [name, value] of Object.entries(headers)) {
    target[name] = value;
  }
}

export function respondAssistantChat<TOk, TInvalid>(
  response: AssistantChatRouteResult,
  handlers: {
    200: (body: Extract<AssistantChatRouteResult, { status: 200 }>["body"]) => TOk;
    422: (body: Extract<AssistantChatRouteResult, { status: 422 }>["body"]) => TInvalid;
  },
): TOk | TInvalid {
  switch (response.status) {
    case 200:
      return handlers[200](response.body);
    case 422:
      return handlers[422](response.body);
    default:
      return assertNever(response);
  }
}

export function respondOkOrForbidden<TBody, TOk, TForbidden>(
  response: OkOrForbiddenRouteResult<TBody>,
  handlers: {
    200: (body: TBody) => TOk;
    403: (body: string) => TForbidden;
  },
): TOk | TForbidden {
  switch (response.status) {
    case 200:
      return handlers[200](response.body);
    case 403:
      return handlers[403](response.body);
    default:
      return assertNever(response);
  }
}

export function respondSelectedModelUpdate<TOk, TForbidden, TUnprocessable>(
  response: UpdateSelectedModelRouteResult,
  handlers: {
    200: (body: Extract<UpdateSelectedModelRouteResult, { status: 200 }>["body"]) => TOk;
    403: (body: Extract<UpdateSelectedModelRouteResult, { status: 403 }>["body"]) => TForbidden;
    422: (body: Extract<UpdateSelectedModelRouteResult, { status: 422 }>["body"]) => TUnprocessable;
  },
): TOk | TForbidden | TUnprocessable {
  switch (response.status) {
    case 200:
      return handlers[200](response.body);
    case 403:
      return handlers[403](response.body);
    case 422:
      return handlers[422](response.body);
    default:
      return assertNever(response);
  }
}

export function respondCopilot<TBody, TOk, TForbidden, TUnprocessable, TRateLimited, TServerError>(
  response: CopilotRouteResult<TBody>,
  handlers: {
    200: (body: TBody) => TOk;
    403: (body: string) => TForbidden;
    422: (body: string) => TUnprocessable;
    429: (body: string) => TRateLimited;
    500: (body: string) => TServerError;
  },
): TOk | TForbidden | TUnprocessable | TRateLimited | TServerError {
  switch (response.status) {
    case 200:
      return handlers[200](response.body);
    case 403:
      return handlers[403](response.body);
    case 422:
      return handlers[422](response.body);
    case 429:
      return handlers[429](response.body);
    case 500:
      return handlers[500](response.body);
    default:
      return assertNever(response);
  }
}

export function respondOptimizeText<TOk, TForbidden, TUnprocessable, TRateLimited>(
  response: OptimizeTextRouteResult,
  handlers: {
    200: (body: Extract<OptimizeTextRouteResult, { status: 200 }>["body"]) => TOk;
    403: (body: Extract<OptimizeTextRouteResult, { status: 403 }>["body"]) => TForbidden;
    422: (body: Extract<OptimizeTextRouteResult, { status: 422 }>["body"]) => TUnprocessable;
    429: (body: Extract<OptimizeTextRouteResult, { status: 429 }>["body"]) => TRateLimited;
  },
): TOk | TForbidden | TUnprocessable | TRateLimited {
  switch (response.status) {
    case 200:
      return handlers[200](response.body);
    case 403:
      return handlers[403](response.body);
    case 422:
      return handlers[422](response.body);
    case 429:
      return handlers[429](response.body);
    default:
      return assertNever(response);
  }
}

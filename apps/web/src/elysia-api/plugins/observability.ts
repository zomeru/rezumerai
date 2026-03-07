import Elysia from "elysia";
import { recordAnalyticsEvent } from "../observability/analytics";
import { recordRequestAuditLog } from "../observability/audit";
import {
  enterRequestContext,
  getRequestContext,
  mergeRequestContextMetadata,
  updateRequestContext,
} from "../observability/request-context";

function resolveStatusCode(setStatus: unknown, response: unknown): number {
  if (typeof setStatus === "number") {
    return setStatus;
  }

  if (response instanceof Response) {
    return response.status;
  }

  return 200;
}

export const observabilityPlugin = new Elysia({ name: "plugin/observability" })
  .onRequest(({ request }) => {
    const url = new URL(request.url);

    enterRequestContext({
      requestId: crypto.randomUUID(),
      source: "API_REQUEST",
      startedAt: performance.now(),
      endpoint: url.pathname,
      method: request.method.toUpperCase(),
      userId: null,
      userRole: null,
      metadata: {},
    });
  })
  .onError({ as: "global" }, ({ code, error }) => {
    mergeRequestContextMetadata({
      errorCode: String(code),
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  })
  .onAfterResponse({ as: "global" }, async (context) => {
    const user = (context as { user?: { id?: string; role?: string } | null }).user;

    if (user?.id) {
      updateRequestContext({
        userId: user.id,
        userRole: typeof user.role === "string" ? user.role : null,
      });
    }

    const requestContext = getRequestContext();
    const statusCode = resolveStatusCode(context.set.status, context.response);
    const durationMs = Math.max(0, Math.round(performance.now() - (requestContext?.startedAt ?? performance.now())));
    const body = (context as { body?: unknown }).body;
    const query = (context as { query?: unknown }).query;
    const params = (context as { params?: unknown }).params;
    const metadata = requestContext?.metadata ?? {};

    await Promise.allSettled([
      recordAnalyticsEvent({
        source: "API_REQUEST",
        eventType: "REQUEST_COMPLETED",
        statusCode,
        durationMs,
        errorCode: typeof metadata.errorCode === "string" ? metadata.errorCode : null,
        errorName: typeof metadata.errorName === "string" ? metadata.errorName : null,
      }),
      recordRequestAuditLog({
        request: context.request,
        statusCode,
        body,
        query,
        params,
      }),
    ]);
  });

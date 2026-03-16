import Elysia from "elysia";
import { queueRecordAnalytics, queueRecordAuditLog } from "../modules/jobs";
import { isJobQueueInitialized } from "../modules/jobs/queue";
import { recordAnalyticsEvent } from "../observability/analytics";
import { recordRequestAuditLog } from "../observability/audit";
import { runPostResponseTask } from "../observability/post-response";
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

function getRequestUser(context: unknown): { id?: string; role?: string } | null {
  if (typeof context !== "object" || context === null || !("user" in context)) {
    return null;
  }

  const { user } = context;
  return typeof user === "object" && user !== null ? user : null;
}

function getRequestBody(context: unknown): unknown {
  return typeof context === "object" && context !== null && "body" in context ? context.body : undefined;
}

function getRequestQuery(context: unknown): unknown {
  return typeof context === "object" && context !== null && "query" in context ? context.query : undefined;
}

function getRequestParams(context: unknown): unknown {
  return typeof context === "object" && context !== null && "params" in context ? context.params : undefined;
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
    const user = getRequestUser(context);

    if (user?.id) {
      updateRequestContext({
        userId: user.id,
        userRole: typeof user.role === "string" ? user.role : null,
      });
    }

    const requestContext = getRequestContext();
    const statusCode = resolveStatusCode(context.set.status, context.response);
    const durationMs = Math.max(0, Math.round(performance.now() - (requestContext?.startedAt ?? performance.now())));
    const body = getRequestBody(context);
    const query = getRequestQuery(context);
    const params = getRequestParams(context);
    const metadata = requestContext?.metadata ?? {};

    // Use job queue if available, otherwise fall back to post-response tasks
    const useJobQueue = isJobQueueInitialized();

    if (useJobQueue) {
      // Queue analytics event (durable, with retries)
      await queueRecordAnalytics({
        source: "API_REQUEST",
        eventType: "REQUEST_COMPLETED",
        statusCode,
        durationMs,
        errorCode: typeof metadata.errorCode === "string" ? metadata.errorCode : null,
        errorName: typeof metadata.errorName === "string" ? metadata.errorName : null,
        metadata: {
          endpoint: requestContext?.endpoint,
          method: requestContext?.method,
        },
      });

      // Queue audit log (durable, with retries)
      await queueRecordAuditLog({
        category: requestContext?.userId ? "USER_ACTION" : "SYSTEM_ACTIVITY",
        eventType: `${requestContext?.method ?? "UNKNOWN"}_REQUEST`,
        action: requestContext?.method ?? "UNKNOWN",
        resourceType: requestContext?.endpoint?.split("/").filter(Boolean).pop()?.toUpperCase() ?? "SYSTEM",
        endpoint: requestContext?.endpoint ?? null,
        method: requestContext?.method ?? null,
        userId: requestContext?.userId ?? null,
      });
    } else {
      // Fallback to post-response tasks (less reliable but works without queue)
      runPostResponseTask(async () => {
        await recordAnalyticsEvent({
          source: "API_REQUEST",
          eventType: "REQUEST_COMPLETED",
          statusCode,
          durationMs,
          errorCode: typeof metadata.errorCode === "string" ? metadata.errorCode : null,
          errorName: typeof metadata.errorName === "string" ? metadata.errorName : null,
        });
      }, "analytics");

      runPostResponseTask(async () => {
        await recordRequestAuditLog({
          request: context.request,
          statusCode,
          body,
          query,
          params,
        });
      }, "audit");
    }
  });

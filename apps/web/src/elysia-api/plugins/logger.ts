import Elysia from "elysia";
import { logger } from "@/lib/logger";

// ─── Request Metadata ─────────────────────────────────────────────────────────

interface RequestMeta {
  start: number;
  contentLength: number;
}

const requestMetadata = new WeakMap<Request, RequestMeta>();

function getErrorStatus(error: unknown): number {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
    ? error.status
    : 500;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export interface LoggerOptions {
  /** Log incoming request when received (before handler). Default: false */
  logIncoming?: boolean;
  /** List of paths to skip logging entirely, e.g. ["/health", "/metrics"] */
  ignore?: string[];
}

function shouldLogRequests(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_API_REQUEST_LOGS === "true";
}

export const loggerPlugin = ({ logIncoming = false, ignore = [] }: LoggerOptions = {}) =>
  new Elysia({ name: "plugin/logger" })
    .onBeforeHandle({ as: "global" }, ({ request }) => {
      if (!shouldLogRequests()) return;

      const url = new URL(request.url);
      if (ignore.includes(url.pathname)) return;

      requestMetadata.set(request, {
        start: performance.now(),
        contentLength: Number(request.headers.get("content-length") ?? 0),
      });

      if (logIncoming) {
        const ip = request.headers.get("x-forwarded-for") ?? "unknown";
        // Use structured logger in addition to pretty console output for dev
        logger.debug(
          {
            method: request.method,
            path: url.pathname + (url.search || ""),
            ip,
          },
          "Incoming request",
        );
      }
    })

    .onAfterResponse({ as: "global" }, ({ request, set }) => {
      if (!shouldLogRequests()) return;

      const url = new URL(request.url);
      if (ignore.includes(url.pathname)) return;

      const meta = requestMetadata.get(request);
      const duration = performance.now() - (meta?.start ?? performance.now());

      const status = typeof set.status === "number" ? set.status : 200;

      // Structured logging for production
      logger.info(
        {
          method: request.method,
          path: url.pathname + (url.search || ""),
          status,
          durationMs: Math.round(duration),
        },
        "Request completed",
      );
    })

    .onError({ as: "global" }, ({ request, error, code }) => {
      if (!shouldLogRequests()) return;

      const url = new URL(request.url);
      if (ignore.includes(url.pathname)) return;

      logger.error(
        {
          method: request.method,
          path: url.pathname,
          status: getErrorStatus(error),
          code,
          error: error instanceof Error ? error.message : String(error),
        },
        "Request error",
      );
    });

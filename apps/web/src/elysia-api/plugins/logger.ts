import Elysia from "elysia";
import {
  bold,
  colorizeDuration,
  colorizeMethod,
  colorizeStatus,
  dim,
  formatBytes,
  paint,
  timestamp,
} from "../utils/ansi";

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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export interface LoggerOptions {
  /** Log incoming request when received (before handler). Default: false */
  logIncoming?: boolean;
  /** List of paths to skip logging entirely, e.g. ["/health", "/metrics"] */
  ignore?: string[];
}

export const loggerPlugin = ({ logIncoming = false, ignore = [] }: LoggerOptions = {}) =>
  new Elysia({ name: "plugin/logger" })
    .onBeforeHandle({ as: "global" }, ({ request }) => {
      const url = new URL(request.url);
      if (ignore.includes(url.pathname)) return;

      requestMetadata.set(request, {
        start: performance.now(),
        contentLength: Number(request.headers.get("content-length") ?? 0),
      });

      if (logIncoming) {
        const ip = request.headers.get("x-forwarded-for") ?? "unknown";
        console.log(
          [timestamp(), colorizeMethod(request.method), bold(url.pathname + (url.search || "")), dim(`← ${ip}`)].join(
            "  ",
          ),
        );
      }
    })

    .onAfterResponse({ as: "global" }, ({ request, set, response }) => {
      const url = new URL(request.url);
      if (ignore.includes(url.pathname)) return;

      const meta = requestMetadata.get(request);
      const duration = performance.now() - (meta?.start ?? performance.now());

      const status = typeof set.status === "number" ? set.status : 200;

      const responseSize =
        typeof response === "string" ? response.length : response instanceof Uint8Array ? response.byteLength : 0;

      const parts = [
        timestamp(),
        colorizeMethod(request.method),
        bold(url.pathname + (url.search || "")),
        colorizeStatus(status),
        colorizeDuration(duration),
      ];

      if (responseSize > 0) parts.push(dim(formatBytes(responseSize)));

      const userAgent = request.headers.get("user-agent");
      if (userAgent) parts.push(dim(`"${userAgent.slice(0, 40)}"`));

      console.log(parts.join("  "));
    })

    .onError({ as: "global" }, ({ request, error, code }) => {
      const url = new URL(request.url);
      if (ignore.includes(url.pathname)) return;

      console.error(
        [
          timestamp(),
          colorizeMethod(request.method),
          bold(url.pathname),
          colorizeStatus(getErrorStatus(error)),
          paint("red", `[${code}]`),
          paint("red", getErrorMessage(error)),
        ].join("  "),
      );
    });

import Elysia from "elysia";

// ─── ANSI Color Helpers ───────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  white: "\x1b[37m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",

  // Background
  bgGreen: "\x1b[42m",
  bgCyan: "\x1b[46m",
  bgYellow: "\x1b[43m",
  bgRed: "\x1b[41m",
  bgMagenta: "\x1b[45m",
  bgBlue: "\x1b[44m",
} as const;

const paint = (color: keyof typeof c, text: string) => `${c[color]}${text}${c.reset}`;

const bold = (text: string) => `${c.bold}${text}${c.reset}`;
const dim = (text: string) => `${c.dim}${text}${c.reset}`;

// ─── Method Coloring ─────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, keyof typeof c> = {
  GET: "bgGreen",
  POST: "bgBlue",
  PUT: "bgYellow",
  PATCH: "bgMagenta",
  DELETE: "bgRed",
  HEAD: "bgCyan",
  OPTIONS: "bgCyan",
};

function colorizeMethod(method: string): string {
  const color = METHOD_COLORS[method] ?? "bgCyan";
  return paint(color, ` ${bold(method)} `);
}

// ─── Status Coloring ──────────────────────────────────────────────────────────

function colorizeStatus(status: number): string {
  if (status < 300) return paint("green", String(status));
  if (status < 400) return paint("cyan", String(status));
  if (status < 500) return paint("yellow", String(status));
  return paint("red", String(status));
}

// ─── Duration Coloring ────────────────────────────────────────────────────────

function colorizeDuration(ms: number): string {
  const label = `${ms.toFixed(2)}ms`;
  if (ms < 100) return paint("green", label);
  if (ms < 500) return paint("yellow", label);
  return paint("red", label);
}

// ─── Content Length ───────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "-";
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

// ─── Timestamp ───────────────────────────────────────────────────────────────

function timestamp(): string {
  return dim(new Date().toISOString());
}

// ─── Request Metadata ─────────────────────────────────────────────────────────

interface RequestMeta {
  start: number;
  contentLength: number;
}

const REQUEST_META = Symbol("request_meta");

type AugmentedRequest = Request & { [REQUEST_META]?: RequestMeta };

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

      const req = request as AugmentedRequest;
      req[REQUEST_META] = {
        start: performance.now(),
        contentLength: Number(request.headers.get("content-length") ?? 0),
      };

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

      const req = request as AugmentedRequest;
      const meta = req[REQUEST_META];
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

      const status = "status" in error ? (error as { status: number }).status : 500;

      console.error(
        [
          timestamp(),
          colorizeMethod(request.method),
          bold(url.pathname),
          colorizeStatus(status),
          paint("red", `[${code}]`),
          paint("red", (error as Error).message ?? "Unknown error"),
        ].join("  "),
      );
    });

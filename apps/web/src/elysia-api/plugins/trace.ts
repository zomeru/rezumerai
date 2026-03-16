import Elysia from "elysia";
import { logger } from "@/lib/logger";

function shouldTraceRequests(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_ELYSIA_TRACE !== "false";
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

/**
 * Elysia trace plugin — injects lifecycle timing into every request.
 *
 * In development it prints a per-request breakdown of:
 *   • beforeHandle middlewares (with individual child timings)
 *   • handle (main route handler)
 *   • afterHandle middlewares
 *
 * Named functions are used for hooks throughout the app so that span names
 * are meaningful (anonymous functions show as "anonymous" in traces).
 *
 * @see https://elysiajs.com/patterns/trace.html
 */
export const tracePlugin = new Elysia({ name: "plugin/trace" }).trace(
  async ({ context, onBeforeHandle, onHandle, onAfterHandle, onError }) => {
    if (!shouldTraceRequests()) {
      return;
    }

    const path = new URL(context.request.url).pathname;

    // ── beforeHandle ────────────────────────────────────────────────────────
    onBeforeHandle(({ total, onEvent, onStop: onBeforeStop }) => {
      if (total === 0) return;

      const childTimings: Array<{ name: string; elapsed: number }> = [];

      onEvent(({ name, onStop }) => {
        onStop(({ elapsed }) => {
          childTimings.push({ name: name || "anonymous", elapsed });
        });
      });

      onBeforeStop(({ elapsed }) => {
        const detail = childTimings.map((t) => `${t.name} ${t.elapsed.toFixed(2)}ms`).join(" -> ");

        logger.debug(
          { path, phase: "beforeHandle", durationMs: elapsed, childTimings: detail || undefined },
          `TRACE ${path} beforeHandle ${elapsed.toFixed(2)}ms${detail ? ` [${detail}]` : ""}`,
        );
      });
    });

    // ── handle ──────────────────────────────────────────────────────────────
    onHandle(({ onStop }) => {
      onStop(({ elapsed }) => {
        logger.debug({ path, phase: "handle", durationMs: elapsed }, `TRACE ${path} handle ${elapsed.toFixed(2)}ms`);
      });
    });

    // ── afterHandle ─────────────────────────────────────────────────────────
    onAfterHandle(({ total, onEvent, onStop: onAfterStop }) => {
      if (total === 0) return;

      const childTimings: Array<{ name: string; elapsed: number }> = [];

      onEvent(({ name, onStop }) => {
        onStop(({ elapsed }) => {
          childTimings.push({ name: name || "anonymous", elapsed });
        });
      });

      onAfterStop(({ elapsed }) => {
        const detail = childTimings.map((t) => `${t.name} ${t.elapsed.toFixed(2)}ms`).join(" -> ");

        logger.debug(
          { path, phase: "afterHandle", durationMs: elapsed, childTimings: detail || undefined },
          `TRACE ${path} afterHandle ${elapsed.toFixed(2)}ms${detail ? ` [${detail}]` : ""}`,
        );
      });
    });

    // ── errors ───────────────────────────────────────────────────────────────
    onError(({ onStop }) => {
      onStop(({ elapsed, error }) => {
        if (!error) return;
        logger.error(
          { path, phase: "error", durationMs: elapsed, error: error instanceof Error ? error.message : String(error) },
          `TRACE ${path} error ${elapsed.toFixed(2)}ms - ${error instanceof Error ? error.message : "unknown"}`,
        );
      });
    });
  },
);

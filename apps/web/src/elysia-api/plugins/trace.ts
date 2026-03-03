import Elysia from "elysia";

// ─── ANSI helpers (reused from logger) ───────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
} as const;

const paint = (color: keyof typeof c, text: string): string => `${c[color]}${text}${c.reset}`;
const dim = (text: string): string => `${c.dim}${text}${c.reset}`;
const bold = (text: string): string => `${c.bold}${text}${c.reset}`;

function colorizeElapsed(ms: number): string {
  const label = `${ms.toFixed(2)}ms`;
  if (ms < 10) return paint("green", label);
  if (ms < 50) return paint("cyan", label);
  if (ms < 200) return paint("yellow", label);
  return paint("red", label);
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
        const detail = childTimings.map((t) => `${dim(t.name)} ${colorizeElapsed(t.elapsed)}`).join(dim(" → "));

        console.log(
          [
            dim(new Date().toISOString()),
            paint("magenta", " TRACE "),
            bold(path),
            paint("cyan", "beforeHandle"),
            colorizeElapsed(elapsed),
            detail ? dim(`[${detail}]`) : "",
          ]
            .filter(Boolean)
            .join("  "),
        );
      });
    });

    // ── handle ──────────────────────────────────────────────────────────────
    onHandle(({ onStop }) => {
      onStop(({ elapsed }) => {
        console.log(
          [
            dim(new Date().toISOString()),
            paint("magenta", " TRACE "),
            bold(path),
            paint("cyan", "handle"),
            colorizeElapsed(elapsed),
          ].join("  "),
        );
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
        const detail = childTimings.map((t) => `${dim(t.name)} ${colorizeElapsed(t.elapsed)}`).join(dim(" → "));

        console.log(
          [
            dim(new Date().toISOString()),
            paint("magenta", " TRACE "),
            bold(path),
            paint("cyan", "afterHandle"),
            colorizeElapsed(elapsed),
            detail ? dim(`[${detail}]`) : "",
          ]
            .filter(Boolean)
            .join("  "),
        );
      });
    });

    // ── errors ───────────────────────────────────────────────────────────────
    onError(({ onStop }) => {
      onStop(({ elapsed, error }) => {
        if (!error) return;
        console.log(
          [
            dim(new Date().toISOString()),
            paint("magenta", " TRACE "),
            bold(path),
            paint("red", "error"),
            colorizeElapsed(elapsed),
            paint("red", (error as Error).message ?? "unknown"),
          ].join("  "),
        );
      });
    });
  },
);

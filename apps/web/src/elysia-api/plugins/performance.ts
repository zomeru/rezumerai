import Elysia from "elysia";
import { bold, colorizeDuration, colorizeMethod, colorizeStatus, dim, paint, timestamp } from "../utils/ansi";

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Read once at module load time. Changing ENABLE_PERF_LOGS at runtime requires
 * a process restart — the same behaviour as NODE_ENV in other plugins.
 */
const PERF_ENABLED = process.env.ENABLE_PERF_LOGS === "true";

// ─── Request Start Marker ─────────────────────────────────────────────────────

const PERF_START = Symbol("perf_start");
type PerfRequest = Request & { [PERF_START]?: number };

// ─── Plugin ───────────────────────────────────────────────────────────────────

/**
 * Elysia performance plugin — tracks HTTP endpoint request/response durations.
 *
 * Controlled via `ENABLE_PERF_LOGS=true`. Silent by default. Production-safe.
 *
 * This plugin does NOT replace the logger. It emits a separate "PERF" line
 * for structured timing data while the logger continues its regular output.
 *
 * **Prisma query performance** is handled separately at the database layer via
 * `Prisma.defineExtension` in `@rezumerai/database`, activated by the same env
 * flag. No additional wiring is required here.
 *
 * ---
 *
 * **Why these lifecycle hooks?**
 *
 * • `onBeforeHandle` — the earliest user-space hook that runs before any route
 *   handler or guard. Stamping the request here captures the full round-trip
 *   including auth and validation, giving a true "time to response" metric.
 *
 * • `onAfterResponse` — fires after the response is flushed to the client.
 *   Paired with `onBeforeHandle`, this measures total wall-clock duration.
 *
 * • `onError` — ensures errored requests are also timed and logged so that
 *   slow-failing paths surface in the performance output.
 *
 * All hooks use `{ as: "global" }` so a single `.use(performancePlugin)` at
 * the app level instruments every route automatically.
 *
 * ---
 *
 * Log format:
 *   <timestamp>  PERF  <METHOD>  <path>  <status>  <duration>
 *
 * @example Global registration (app-level — instruments all routes):
 * ```ts
 * app.use(performancePlugin)
 * ```
 *
 * @example Scoped registration (route-group — instruments a subset):
 * ```ts
 * new Elysia().use(performancePlugin).get("/items", ...)
 * ```
 */
export const performancePlugin = new Elysia({ name: "plugin/performance" })
  .onBeforeHandle({ as: "global" }, function perfStart({ request }) {
    if (!PERF_ENABLED) return;
    (request as PerfRequest)[PERF_START] = performance.now();
  })

  .onAfterResponse({ as: "global" }, function perfEnd({ request, set }) {
    if (!PERF_ENABLED) return;

    const req = request as PerfRequest;
    const start = req[PERF_START];
    if (start == null) return;

    const duration = performance.now() - start;
    const url = new URL(request.url);
    const status = typeof set.status === "number" ? set.status : 200;

    console.log(
      [
        timestamp(),
        paint("cyan", " PERF "),
        colorizeMethod(request.method),
        bold(url.pathname + (url.search || "")),
        colorizeStatus(status),
        colorizeDuration(duration),
      ].join("  "),
    );
  })

  .onError({ as: "global" }, function perfError({ request, error }) {
    if (!PERF_ENABLED) return;

    const req = request as PerfRequest;
    const start = req[PERF_START];
    if (start == null) return;

    const duration = performance.now() - start;
    const url = new URL(request.url);
    const status = "status" in error ? (error as { status: number }).status : 500;

    console.log(
      [
        timestamp(),
        paint("cyan", " PERF "),
        colorizeMethod(request.method),
        bold(url.pathname),
        colorizeStatus(status),
        colorizeDuration(duration),
        dim("(error)"),
      ].join("  "),
    );
  });

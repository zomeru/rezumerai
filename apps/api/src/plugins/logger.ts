import Elysia from "elysia";

/**
 * Logger plugin — logs every incoming request with method, path, status, and
 * duration. Lightweight replacement for `morgan("tiny")`.
 */
export const loggerPlugin = new Elysia({ name: "plugin/logger" })
  .onBeforeHandle({ as: "global" }, ({ request }) => {
    // Attach timestamp for duration calculation
    (request as Request & { __start?: number }).__start = performance.now();
  })
  .onAfterResponse({ as: "global" }, ({ request, set }) => {
    const start = (request as Request & { __start?: number }).__start ?? performance.now();
    const duration = (performance.now() - start).toFixed(2);
    const method = request.method;
    const url = new URL(request.url).pathname;
    const status = set.status ?? 200;

    console.log(`${method} ${url} ${status} - ${duration}ms`);
  });

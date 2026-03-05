import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "prisma/config";
import { Prisma, PrismaClient } from "./generated/prisma/client";

export * from "./generated/prisma/client";

// ─── Globals ──────────────────────────────────────────────────────────────────

/**
 * Global reference to hold the BASE Prisma client across hot reloads.
 * We intentionally cache the base client (not the extended one) so that
 * the perf extension is never applied more than once per process.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL ?? env("DATABASE_URL");

/**
 * Selects the appropriate Prisma adapter based on the database connection string.
 * Uses PrismaNeon for Neon serverless PostgreSQL (WebSocket-based), and PrismaPg
 * for standard PostgreSQL connections (e.g. local Docker).
 */
const adapter = connectionString.includes(".neon.tech")
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });

// ─── Inline ANSI helpers ──────────────────────────────────────────────────────
// Kept local to this package to avoid a cross-package dependency on app-layer utils.

const _c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
} as const;

const _p = (code: string, text: string): string => `${code}${text}${_c.reset}`;
const _ts = (): string => _p(_c.dim, new Date().toISOString());
const _dur = (ms: number): string => {
  const label = `${ms.toFixed(2)}ms`;
  if (ms < 100) return _p(_c.green, label);
  if (ms < 500) return _p(_c.yellow, label);
  return _p(_c.red, label);
};

// ─── Performance Extension ────────────────────────────────────────────────────

/**
 * Prisma Client extension that intercepts every model operation to measure
 * and log query duration.
 *
 * Activated when ENABLE_PERF_LOGS=true. Uses `Prisma.defineExtension` with
 * `$allOperations` — the Prisma 5+ replacement for the removed `$use` middleware.
 *
 * Log format:
 *   <timestamp>  PERF  prisma  <Model>.<action>  <duration>
 *
 * @example
 *   2026-03-04T21:00:00.000Z  PERF  prisma  Resume.findMany  23.45ms
 */
const perfExtension = Prisma.defineExtension({
  name: "perf-logger",
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        const result = await query(args);
        const duration = performance.now() - start;
        console.log(
          [
            _ts(),
            _p(_c.cyan, " PERF "),
            _p(_c.magenta, "prisma"),
            _p(_c.bold, `${model ?? "unknown"}.${operation}`),
            _dur(duration),
          ].join("  "),
        );
        return result;
      },
    },
  },
});

// ─── Singleton ────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === "development";

/**
 * Base Prisma client. Cached in `globalForPrisma` (not the extended wrapper)
 * to prevent double-wrapping the perf extension across hot reloads.
 */
const baseClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: isDev ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;

/**
 * Shared Prisma client singleton for database access.
 *
 * When ENABLE_PERF_LOGS=true, all model operations are wrapped with the
 * perf-logger extension which logs model name, action, and duration.
 * The exported type is preserved via type assertion so downstream consumers
 * (prismaPlugin, route handlers) require no changes.
 *
 * @example
 * ```ts
 * import { prisma } from "@rezumerai/database";
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma: typeof baseClient = isDev
  ? (baseClient.$extends(perfExtension) as unknown as typeof baseClient)
  : baseClient;

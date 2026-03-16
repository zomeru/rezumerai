import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "prisma/config";
import { PrismaClient } from "./generated/prisma/client";

export * from "./generated/prisma/client";
export { Prisma } from "./generated/prisma/client";

// ─── Globals ──────────────────────────────────────────────────────────────────

declare global {
  var __rezumeraiPrisma: PrismaClient | undefined;
}

/**
 * Global reference to hold the BASE Prisma client across hot reloads.
 * We intentionally cache the base client (not the extended one) so that
 * the perf extension is never applied more than once per process.
 */
const globalForPrisma = globalThis;
const connectionString = process.env.DATABASE_URL ?? env("DATABASE_URL");

function ensureSslModeForPg(url: string): string {
  if (url.includes(".neon.tech")) return url;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return url;

  const sslmodeRegex = /sslmode=[^&]*/;
  if (sslmodeRegex.test(url)) {
    return url.replace(sslmodeRegex, "sslmode=verify-full");
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sslmode=verify-full`;
}

const isNeon = connectionString.includes(".neon.tech");

/**
 * Selects the appropriate Prisma adapter based on the database connection string.
 * Uses PrismaNeon for Neon serverless PostgreSQL (WebSocket-based), and PrismaPg
 * for standard PostgreSQL connections (e.g. local Docker).
 */
const adapter = isNeon
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString: ensureSslModeForPg(connectionString) });

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

const isDev = process.env.NODE_ENV === "development";

/**
 * Base Prisma client. Cached in `globalForPrisma` to prevent reconnect churn
 * across hot reloads.
 */
const baseClient =
  globalForPrisma.__rezumeraiPrisma ||
  new PrismaClient({
    adapter,
    log: isDev ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__rezumeraiPrisma = baseClient;

/**
 * Shared Prisma client singleton for database access.
 *
 * This export intentionally stays as the base Prisma client so every consumer
 * sees one stable type across environments.
 *
 * @example
 * ```ts
 * import { prisma } from "@rezumerai/database";
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma = baseClient;

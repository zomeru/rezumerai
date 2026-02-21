import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export * from "./generated/prisma/client";

/**
 * Global reference to hold the Prisma client singleton across hot reloads.
 * Prevents connection exhaustion in development by reusing the same client instance.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * PostgreSQL adapter for Prisma using the native pg driver.
 * Reads the connection string from the DATABASE_URL environment variable.
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Shared Prisma client singleton for database access.
 * Uses a global reference in non-production environments to survive hot reloads.
 * Logs queries, errors, and warnings in development; only errors in production.
 *
 * @example
 * ```ts
 * import { prisma } from "@rezumerai/database";
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

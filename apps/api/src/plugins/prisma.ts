import { prisma } from "@rezumerai/database";
import Elysia from "elysia";

/**
 * Prisma plugin — decorates the Elysia context with the shared Prisma client
 * imported from `@rezumerai/database`.
 *
 * Usage in modules:
 *   .get('/items', ({ db }) => db.sampleTable.findMany())
 */
export const prismaPlugin = new Elysia({ name: "plugin/prisma" }).decorate("db", prisma);

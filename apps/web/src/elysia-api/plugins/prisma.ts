import Elysia from "elysia";
import { observedPrisma } from "../observability/prisma-observer";

/**
 * Prisma plugin — decorates the Elysia context with the shared Prisma client
 * imported from `@rezumerai/database`.
 *
 * Usage in modules:
 *   .get('/items', ({ db }) => db.sampleTable.findMany())
 */
export const prismaPlugin = new Elysia({ name: "plugin/prisma" }).decorate("db", observedPrisma);

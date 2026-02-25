import cors from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { swagger } from "@elysiajs/swagger";
import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";
import Elysia from "elysia";
import { helmet } from "elysia-helmet";
import { httpExceptionPlugin } from "elysia-http-exception";
import { rateLimit } from "elysia-rate-limit";
import { elysiaXSS } from "elysia-xss";
import { serverEnv } from "@/env";
import { auth } from "@/lib/auth";
import { resumeModule, userModule } from "./modules";
import { errorPlugin, loggerPlugin, modernCsrf, prismaPlugin } from "./plugins";

/**
 * Elysia application — single source of truth for the API.
 *
 * All routes, plugins, and modules are registered here.
 * The exported `App` type is consumed by Eden on the frontend
 * for end-to-end type safety.
 */

export const elysiaApp = new Elysia({ prefix: "/api" })
  // ── Cross-cutting plugins ───────────────────────────────────────────────
  .use(cors())
  .use(elysiaXSS())
  .use(serverEnv?.NODE_ENV !== "development" ? rateLimit() : (app) => app) // Disable rate limiting in development for easier testing
  .use(httpExceptionPlugin())
  .use(helmet())
  .use(modernCsrf())
  .use(swagger())
  .use(openapi())
  .use(loggerPlugin())
  .use(errorPlugin)
  .use(prismaPlugin)
  .get("/", "Hello Nextjs")

  // ── Health check (root) ─────────────────────────────────────────────────
  .get("/health", async ({ db }) => {
    const message = capitalize("Health check successful!");
    const timestamp = formatDate(new Date(), {
      dateStyle: "short",
      timeStyle: "short",
    });

    try {
      const sampleDbData = await db.sampleTable.findFirst({
        select: { id: true },
      });

      return {
        success: true,
        data: {
          message,
          timestamp,
          server: "Rezumer API",
          sampleDbData,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: {
          message,
          timestamp,
          server: "Rezumer API",
        },
      };
    }
  })

  // ── Feature modules ─────────────────────────────────────────────────────
  .use(userModule)
  .use(resumeModule);

/** Export the app type for Eden treaty on the frontend. */

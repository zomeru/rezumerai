import cors from "@elysiajs/cors";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { swagger } from "@elysiajs/swagger";
import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";
import Elysia from "elysia";
import { helmet } from "elysia-helmet";
import { httpExceptionPlugin } from "elysia-http-exception";
import { rateLimit } from "elysia-rate-limit";
import { elysiaXSS } from "elysia-xss";
import { env } from "./env";
import { authModule } from "./modules/auth";
import { userModule } from "./modules/user";
import { errorPlugin } from "./plugins/error";
import { loggerPlugin } from "./plugins/logger";
import { modernCsrf } from "./plugins/modernCsrf";

/**
 * Elysia application — single source of truth for the API.
 *
 * All routes, plugins, and modules are registered here.
 * The exported `App` type is consumed by Eden on the frontend
 * for end-to-end type safety.
 */
export const app = new Elysia({ prefix: "/api" })
  // ── Cross-cutting plugins ───────────────────────────────────────────────
  .use(
    cors({
      credentials: true,
      origin: env.CORS_ORIGINS,
    }),
  )
  .use(elysiaXSS())
  .use(rateLimit())
  .use(httpExceptionPlugin())
  .use(helmet())
  .use(
    modernCsrf({
      trustedOrigins: env.CORS_ORIGINS,
    }),
  )
  .use(swagger())
  .use(
    openapi({
      references: fromTypes(process.env.NODE_ENV === "production" ? "dist/index.d.ts" : "src/index.ts"),
    }),
  )
  .use(loggerPlugin())
  .use(errorPlugin)

  // ── Health check (root) ─────────────────────────────────────────────────
  .get("/health", () => {
    const message = capitalize("hello from elysia!");
    const timestamp = formatDate(new Date(), {
      dateStyle: "short",
      timeStyle: "short",
    });

    return {
      success: true,
      data: {
        message,
        timestamp,
        server: "Rezumer API (Elysia + Bun)",
      },
    };
  })

  // ── Feature modules ─────────────────────────────────────────────────────
  .use(authModule)
  .use(userModule);

/** Export the app type for Eden treaty on the frontend. */
export type App = typeof app;

import cors from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { swagger } from "@elysiajs/swagger";
import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";
import Elysia from "elysia";
import { httpExceptionPlugin } from "elysia-http-exception";
import { rateLimit } from "elysia-rate-limit";
import { elysiaHelmet } from "elysiajs-helmet";
import { resumeModule, userModule } from "./modules";
import {
  authPlugin,
  errorPlugin,
  loggerPlugin,
  modernCsrf,
  opentelemetryPlugin,
  prismaPlugin,
  tracePlugin,
} from "./plugins";

/**
 * Elysia application — single source of truth for the API.
 *
 * All routes, plugins, and modules are registered here.
 * The exported `App` type is consumed by Eden on the frontend
 * for end-to-end type safety.
 */

export const elysiaApp = new Elysia({ prefix: "/api" })
  // 0. Observability (must be first to capture all lifecycle spans)
  .use(opentelemetryPlugin)
  .use(tracePlugin)

  // 1. Security first
  .use(
    elysiaHelmet({
      csp: {
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "blob:", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.scalar.com"],
        connectSrc: ["'self'", "https://proxy.scalar.com", "https://cdn.jsdelivr.net"],
      },
    }),
  )
  .use(cors())
  .use(process.env.NODE_ENV !== "development" ? rateLimit() : (app) => app)
  .use(modernCsrf())

  // 2. Core infrastructure
  .use(prismaPlugin)
  .use(loggerPlugin())

  // 3. Error handling (should wrap everything after infra)
  .use(httpExceptionPlugin())
  .use(errorPlugin)

  // 4. Documentation (dev only — never expose in production)
  .use(process.env.NODE_ENV === "development" ? swagger() : (app) => app)
  .use(process.env.NODE_ENV === "development" ? openapi() : (app) => app)
  .get("/", "Hello Nextjs")

  // ── Health check (root) ─────────────────────────────────────────────────
  .use(authPlugin)
  .get("/health", async ({ db }) => {
    const message = capitalize("Health check successful!");
    const timestamp = formatDate(new Date(), {
      dateStyle: "short",
      timeStyle: "short",
    });

    const sampleDbData = await db.sampleTable.findFirst({
      select: { id: true },
    });

    return {
      message,
      timestamp,
      server: "Rezumer API",
      sampleDbData,
    };
  })

  // ── Feature modules ─────────────────────────────────────────────────────
  .use(userModule)
  .use(resumeModule);

/** Export the app type for Eden treaty on the frontend. */

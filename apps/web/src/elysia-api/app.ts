import cors from "@elysiajs/cors";
import { cron, Patterns } from "@elysiajs/cron";
import { openapi } from "@elysiajs/openapi";
import { swagger } from "@elysiajs/swagger";
import { prisma } from "@rezumerai/database";
import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";
import Elysia from "elysia";
import { httpExceptionPlugin } from "elysia-http-exception";
import { rateLimit } from "elysia-rate-limit";
import { elysiaHelmet } from "elysiajs-helmet";
import { serverEnv } from "@/env";
import { adminModule, aiModule, profileModule, resumeModule, userModule } from "./modules";
import { ErrorLogService } from "./modules/admin/service";
import { recordAnalyticsEvent } from "./observability/analytics";
import { recordSystemActivityLog } from "./observability/audit";
import { runWithSystemContext } from "./observability/request-context";
import {
  authPlugin,
  createApiHelmetConfig,
  createCorsConfig,
  errorPlugin,
  loggerPlugin,
  modernCsrf,
  observabilityPlugin,
  opentelemetryPlugin,
  prismaPlugin,
  tracePlugin,
} from "./plugins";
import { timestamp as ansiTimestamp, bold, dim, paint } from "./utils/ansi";

const isDev = process.env.NODE_ENV === "development";
// const cronPattern = isDev ? Patterns.EVERY_5_MINUTES : Patterns.weekly();
const errorLogRetentionCronPattern = Patterns.EVERY_DAY_AT_3AM;
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
  .use(observabilityPlugin)

  // 1. Security first
  .use(elysiaHelmet(createApiHelmetConfig({ isDev })))
  .use(
    cors(
      createCorsConfig({
        NEXT_PUBLIC_SITE_URL: serverEnv?.NEXT_PUBLIC_SITE_URL ?? "",
        BETTER_AUTH_URL: serverEnv?.BETTER_AUTH_URL ?? "",
        CORS_ALLOWED_ORIGINS: serverEnv?.CORS_ALLOWED_ORIGINS,
      }),
    ),
  )
  .use(
    !isDev
      ? rateLimit({
          generator: ({ headers }) => {
            const forwardedFor = headers.get("x-forwarded-for");
            const realIp = headers.get("x-real-ip");
            const cfConnectingIp = headers.get("cf-connecting-ip");

            return forwardedFor?.split(",")[0]?.trim() || realIp || cfConnectingIp || "anonymous";
          },
        })
      : (app) => app,
  )
  .use(modernCsrf())

  // 2. Core infrastructure
  .use(prismaPlugin)
  .use(loggerPlugin())

  // 3. Error handling (should wrap everything after infra)
  .use(httpExceptionPlugin())
  .use(errorPlugin)

  // 4. Documentation (dev only — never expose in production)
  .use(
    isDev
      ? swagger({
          scalarConfig: {
            withDefaultFonts: false,
          },
        })
      : (app) => app,
  )
  .use(
    isDev
      ? openapi({
          scalar: {
            withDefaultFonts: false,
          },
        })
      : (app) => app,
  )
  .get("/", "Hello from Rezumer!")

  .use(
    cron({
      name: "error-log-retention-cleanup",
      pattern: errorLogRetentionCronPattern,
      async run() {
        await runWithSystemContext(
          {
            requestId: `cron-error-log-retention-${Date.now()}`,
            source: "BACKGROUND_JOB",
            endpoint: null,
            method: null,
            userId: null,
            userRole: null,
            metadata: { serviceName: "error-log-retention-cleanup" },
          },
          async () => {
            const startedAt = performance.now();

            try {
              const { deletedCount, retentionDays, cutoffDate } = await ErrorLogService.cleanupExpiredErrorLogs(prisma);
              const durationMs = Math.max(0, Math.round(performance.now() - startedAt));

              await Promise.allSettled([
                recordSystemActivityLog({
                  eventType: "ERROR_LOG_RETENTION_CLEANUP",
                  action: "RUN",
                  resourceType: "ERROR_LOG",
                  serviceName: "error-log-retention-cleanup",
                  metadata: {
                    status: "success",
                  },
                  afterValues: {
                    deletedCount,
                    retentionDays,
                    cutoffDate: cutoffDate.toISOString(),
                    durationMs,
                  },
                }),
                recordAnalyticsEvent({
                  source: "BACKGROUND_JOB",
                  eventType: "ERROR_LOG_RETENTION_CLEANUP",
                  durationMs,
                  metadata: {
                    name: "error-log-retention-cleanup",
                    status: "success",
                    deletedCount,
                  },
                }),
              ]);

              if (isDev || deletedCount > 0) {
                console.log(
                  [
                    ansiTimestamp(),
                    paint("bgCyan", ` ${bold("CRON")} `),
                    bold("error-log-retention"),
                    paint("green", `✓ deleted=${deletedCount}`),
                    dim(`retentionDays=${retentionDays}`),
                    dim(`cutoff<${cutoffDate.toISOString()}`),
                  ].join("  "),
                );
              }
            } catch (error: unknown) {
              const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
              const message = error instanceof Error ? error.message : "Unknown retention cleanup error";

              await Promise.allSettled([
                recordSystemActivityLog({
                  eventType: "ERROR_LOG_RETENTION_CLEANUP",
                  action: "RUN_FAILED",
                  resourceType: "ERROR_LOG",
                  serviceName: "error-log-retention-cleanup",
                  metadata: {
                    status: "failed",
                    message,
                  },
                  afterValues: {
                    durationMs,
                  },
                }),
                recordAnalyticsEvent({
                  source: "BACKGROUND_JOB",
                  eventType: "ERROR_LOG_RETENTION_CLEANUP",
                  durationMs,
                  errorCode: "CRON_FAILURE",
                  errorName: error instanceof Error ? error.name : "UnknownError",
                  metadata: {
                    name: "error-log-retention-cleanup",
                    status: "failed",
                  },
                }),
              ]);

              console.error(
                [
                  ansiTimestamp(),
                  paint("bgRed", ` ${bold("CRON")} `),
                  bold("error-log-retention"),
                  paint("red", "✗ cleanup failed"),
                  dim(message),
                ].join("  "),
              );
            }
          },
        );
      },
    }),
  )
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
  .use(adminModule)
  .use(userModule)
  .use(profileModule)
  .use(resumeModule)
  .use(aiModule);

/** Export the app type for Eden treaty on the frontend. */

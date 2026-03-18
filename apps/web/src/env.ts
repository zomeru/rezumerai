import { z } from "zod";

/**
 * Environment variable schema validation.
 *
 * Build-time: Only public/client variables are validated eagerly.
 * Runtime: Server-only secrets are validated lazily on first access,
 * so that `next build` does not require runtime secrets.
 *
 * Security: Never expose sensitive backend URLs or keys via NEXT_PUBLIC_ prefix.
 */

// ── Build-time / client schema ──────────────────────────────────────────────
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().describe("Public site URL for metadata"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// ── Server-only schema (validated lazily at runtime) ────────────────────────
const serverSchema = clientSchema.extend({
  BETTER_AUTH_URL: z.url().describe("Better Auth URL for authentication"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
    .describe("Better Auth secret for signing tokens"),
  BETTER_AUTH_GITHUB_CLIENT_ID: z
    .string()
    .min(1, "BETTER_AUTH_GITHUB_CLIENT_ID is required")
    .describe("GitHub OAuth client ID"),
  BETTER_AUTH_GITHUB_CLIENT_SECRET: z
    .string()
    .min(1, "BETTER_AUTH_GITHUB_CLIENT_SECRET is required")
    .describe("GitHub OAuth client secret"),
  BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional().describe("Google OAuth client ID"),
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional().describe("Google OAuth client secret"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
      "DATABASE_URL must be a valid PostgreSQL connection string",
    )
    .describe("Database connection URL (server-only)"),
  OPENROUTER_API_KEY: z
    .string()
    .min(1, "OPENROUTER_API_KEY is required")
    .describe("OpenRouter API key for AI text optimization"),
  SENTRY_DSN: z.string().optional().describe("Sentry DSN for error tracking"),
  ANALYTICS_ID: z.string().optional().describe("Analytics tracking ID"),
  CORS_ALLOWED_ORIGINS: z.string().optional().describe("Comma-separated list of extra allowed CORS origins"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z
    .string()
    .optional()
    .describe("OTLP collector endpoint (e.g. https://api.axiom.co/v1/traces)"),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional().describe("Comma-separated key=value auth headers for OTLP export"),
  JOB_QUEUE_ENABLED: z.string().optional().default("true").describe("Enable background job queue (true/false)"),
  JOB_QUEUE_WORKER_COUNT: z.string().optional().default("1").describe("Number of worker processes to run"),
  SHUTDOWN_TIMEOUT_MS: z
    .string()
    .optional()
    .default("30000")
    .describe("Graceful shutdown timeout in milliseconds (default: 30s)"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

// ── Eagerly validated (safe during build — only public vars) ────────────────
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

// ── Lazily validated (only runs when server code actually executes) ──────────
let _serverEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;
  _serverEnv = serverSchema.parse(process.env);
  return _serverEnv;
}

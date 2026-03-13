import { z } from "zod";

/**
 * Environment variable schema validation.
 * Ensures all required environment variables are present and valid at build time.
 *
 * Security: Never expose sensitive backend URLs or keys via NEXT_PUBLIC_ prefix.
 */
const isServer = typeof window === "undefined";

// Client-side schema (only public variables)
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().describe("Public site URL for metadata"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Server-side schema (includes sensitive variables)
const serverSchema = clientSchema.extend({
  // Authentication variables (server-side only)
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

  // AI (server-side only)
  OPENROUTER_API_KEY: z
    .string()
    .min(1, "OPENROUTER_API_KEY is required")
    .describe("OpenRouter API key for AI text optimization"),

  // Optional analytics/monitoring (server-side only)
  SENTRY_DSN: z.string().optional().describe("Sentry DSN for error tracking"),
  ANALYTICS_ID: z.string().optional().describe("Analytics tracking ID"),

  // Optional OpenTelemetry export (server-side only)
  OTEL_EXPORTER_OTLP_ENDPOINT: z
    .string()
    .optional()
    .describe("OTLP collector endpoint (e.g. https://api.axiom.co/v1/traces)"),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional().describe("Comma-separated key=value auth headers for OTLP export"),
});

/**
 * Parsed and validated environment variables.
 * Throws an error at build time if validation fails.
 * Client-side only has access to NEXT_PUBLIC_ variables.
 */
export const clientEnv = clientSchema.parse(process.env);
export const serverEnv = isServer ? serverSchema.parse(process.env) : undefined;

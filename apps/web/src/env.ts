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
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:8080").describe("Public API URL for client-side requests"),
  NEXT_PUBLIC_SITE_URL: z
    .url()
    .default("http://localhost:3000") // Will be used as BETTER_AUTH_URL for client-side auth requests
    .describe("Public site URL for metadata"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Server-side schema (includes sensitive variables)
const serverSchema = clientSchema.extend({
  // Authentication variables (server-side only)
  // BETTER_AUTH_URL: z
  //   .url()
  //   .default("http://localhost:3000") // Commenting out since it's the same as NEXT_PUBLIC_SITE_URL and not needed on server
  //   .describe("Better Auth URL for authentication"),
  BETTER_AUTH_SECRET: z.string().default("super_long_secret").describe("Better Auth secret for signing tokens"),
  BETTER_AUTH_GITHUB_CLIENT_ID: z.string().describe("GitHub OAuth client ID"),
  BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string().describe("GitHub OAuth client secret"),
  BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional().describe("Google OAuth client ID"),
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional().describe("Google OAuth client secret"),
  DATABASE_URL: z.url().describe("Database connection URL (server-only)"),

  // Optional analytics/monitoring (server-side only)
  SENTRY_DSN: z.string().optional().describe("Sentry DSN for error tracking"),
  ANALYTICS_ID: z.string().optional().describe("Analytics tracking ID"),
});

/**
 * Parsed and validated environment variables.
 * Throws an error at build time if validation fails.
 * Client-side only has access to NEXT_PUBLIC_ variables.
 */
export const clientEnv = clientSchema.parse(process.env);
export const serverEnv = isServer ? serverSchema.parse(process.env) : undefined;

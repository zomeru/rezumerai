import { z } from "zod";

/**
 * Environment variable schema validation.
 * Ensures all required environment variables are present and valid at build time.
 *
 * Security: Never expose sensitive backend URLs or keys via NEXT_PUBLIC_ prefix.
 */
// biome-ignore lint/nursery/useExplicitType: Zod inferred type is more accurate than explicit annotation
const envSchema = z.object({
  // Public variables (exposed to browser)
  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .default("http://localhost:8080")
    .describe("Public API URL for client-side requests"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000").describe("Public site URL for metadata"),

  // Server-only variables (never exposed to browser)
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Optional analytics/monitoring (server-side only)
  SENTRY_DSN: z.string().optional().describe("Sentry DSN for error tracking"),
  ANALYTICS_ID: z.string().optional().describe("Analytics tracking ID"),
});

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parsed and validated environment variables.
 * Throws an error at build time if validation fails.
 */
export const env: Env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
  SENTRY_DSN: process.env.SENTRY_DSN,
  ANALYTICS_ID: process.env.ANALYTICS_ID,
});

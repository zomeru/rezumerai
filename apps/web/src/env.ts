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
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:8080").describe("Public API URL for client-side requests"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000").describe("Public site URL for metadata"),

  // Authentication variables (server-side only)
  NEXTAUTH_URL: z.url().default("http://localhost:3000").describe("NextAuth URL for authentication"),
  NEXTAUTH_SECRET: z.string().default("super_long_secret").describe("NextAuth secret for signing tokens"),
  GITHUB_CLIENT_ID: z.string().describe("GitHub OAuth client ID"),
  GITHUB_CLIENT_SECRET: z.string().describe("GitHub OAuth client secret"),
  GOOGLE_CLIENT_ID: z.string().optional().describe("Google OAuth client ID"),
  GOOGLE_CLIENT_SECRET: z.string().optional().describe("Google OAuth client secret"),
  DATABASE_URL: z.url().describe("Database connection URL (server-only)"),

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
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
});

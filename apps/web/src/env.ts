import { z } from "zod";

/**
 * Environment variable schema validation.
 * Ensures all required environment variables are present and valid at build time.
 *
 * Security: Never expose sensitive backend URLs or keys via NEXT_PUBLIC_ prefix.
 */
const isServer: boolean = typeof window === "undefined";

type ClientSchema = z.ZodObject<
  {
    NEXT_PUBLIC_API_URL: z.ZodDefault<z.ZodURL>;
    NEXT_PUBLIC_SITE_URL: z.ZodDefault<z.ZodURL>;
    NODE_ENV: z.ZodDefault<
      z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
      }>
    >;
  },
  z.core.$strip
>;

type ServerSchema = z.ZodObject<
  {
    NEXT_PUBLIC_API_URL: z.ZodDefault<z.ZodURL>;
    NEXT_PUBLIC_SITE_URL: z.ZodDefault<z.ZodURL>;
    NODE_ENV: z.ZodDefault<
      z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
      }>
    >;
    BETTER_AUTH_URL: z.ZodDefault<z.ZodURL>;
    BETTER_AUTH_SECRET: z.ZodDefault<z.ZodString>;
    BETTER_AUTH_GITHUB_CLIENT_ID: z.ZodString;
    BETTER_AUTH_GITHUB_CLIENT_SECRET: z.ZodString;
    BETTER_AUTH_GOOGLE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    DATABASE_URL: z.ZodURL;
    SENTRY_DSN: z.ZodOptional<z.ZodString>;
    ANALYTICS_ID: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;

// Client-side schema (only public variables)
const clientSchema: ClientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:8080").describe("Public API URL for client-side requests"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000").describe("Public site URL for metadata"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Server-side schema (includes sensitive variables)
const serverSchema: ServerSchema = clientSchema.extend({
  // Authentication variables (server-side only)
  BETTER_AUTH_URL: z.url().default("http://localhost:3000").describe("Better Auth URL for authentication"),
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

// Use appropriate schema based on environment
const envSchema: ClientSchema | ServerSchema = isServer ? serverSchema : clientSchema;

/**
 * Type-safe environment variables (server-side has full access)
 */
export type Env = z.infer<typeof serverSchema>;

/**
 * Parsed and validated environment variables.
 * Throws an error at build time if validation fails.
 * Client-side only has access to NEXT_PUBLIC_ variables.
 */
export const env = envSchema.parse(
  isServer
    ? {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NODE_ENV: process.env.NODE_ENV,
        SENTRY_DSN: process.env.SENTRY_DSN,
        ANALYTICS_ID: process.env.ANALYTICS_ID,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        BETTER_AUTH_GOOGLE_CLIENT_ID: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
        BETTER_AUTH_GOOGLE_CLIENT_SECRET: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
        BETTER_AUTH_GITHUB_CLIENT_ID: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
        BETTER_AUTH_GITHUB_CLIENT_SECRET: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
      }
    : {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
) as Env;

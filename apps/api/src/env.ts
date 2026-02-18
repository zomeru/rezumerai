import { type ZodType, z } from "zod";

/**
 * Zod validation schema for API environment variables.
 * Validates and transforms required configuration at startup.
 *
 * @property API_PORT - API server port (default: 8080)
 * @property NODE_ENV - Runtime environment (development | production | test)
 * @property DATABASE_URL - PostgreSQL connection string (required)
 * @property BETTER_AUTH_SECRET - NextAuth secret for session encryption (required)
 * @property BETTER_AUTH_URL - NextAuth canonical URL (default: http://localhost:3000)
 * @property CORS_ORIGINS - Comma-separated allowed origins (auto-split to array)
 */
// biome-ignore lint/nursery/useExplicitType: Zod type inference required for env
const envSchema = z.object({
  API_PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001")
    .transform((s) => s.split(",")),
}) satisfies ZodType;

/**
 * Validated environment variable configuration type.
 * Inferred from envSchema with all transformations applied.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates environment variables against the schema.
 * Exits process with error code 1 if validation fails.
 *
 * @returns Validated and transformed environment configuration
 * @throws Process exit on validation failure
 */
function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

/**
 * Validated environment configuration singleton.
 * Parsed and validated at module initialization.
 * Safe to import and use throughout the API application.
 *
 * @example
 * ```ts
 * import { env } from './env';
 * console.log(`API running on port ${env.API_PORT}`);
 * ```
 */
export const env: Env = parseEnv();

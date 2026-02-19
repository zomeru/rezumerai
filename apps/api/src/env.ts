import { type ZodType, z } from "zod";

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
 * Parses and validates environment variables against the schema.
 * Exits process with error code 1 if validation fails.
 *
 * @returns Validated and transformed environment configuration
 * @throws Process exit on validation failure
 */
function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", z.treeifyError(result.error));
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
export const env = parseEnv();

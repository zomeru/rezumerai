import type { CORSConfig } from "@elysiajs/cors";

type CorsEnv = {
  NEXT_PUBLIC_SITE_URL: string;
  BETTER_AUTH_URL: string;
  CORS_ALLOWED_ORIGINS?: string;
};

const CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;
const CORS_ALLOWED_HEADERS = ["Content-Type", "Authorization"] as const;

function splitConfiguredOrigins(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getAllowedCorsOrigins(env: CorsEnv): string[] {
  const origins = [
    env.NEXT_PUBLIC_SITE_URL,
    env.BETTER_AUTH_URL,
    ...splitConfiguredOrigins(env.CORS_ALLOWED_ORIGINS),
  ].filter(Boolean);

  return Array.from(new Set(origins));
}

export function createCorsConfig(env: CorsEnv): CORSConfig {
  return {
    origin: getAllowedCorsOrigins(env),
    credentials: true,
    methods: [...CORS_METHODS],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
  };
}

import { defineConfig, env } from "prisma/config";

function ensureSslModeForPg(url: string): string {
  if (url.includes(".neon.tech")) return url;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return url;

  const sslmodeRegex = /sslmode=[^&]*/;
  if (sslmodeRegex.test(url)) {
    return url.replace(sslmodeRegex, "sslmode=verify-full");
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sslmode=verify-full`;
}

const directUrl = process.env.DIRECT_URL ?? env("DIRECT_URL");

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: ensureSslModeForPg(directUrl),
  },
});

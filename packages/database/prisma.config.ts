import { defineConfig, env } from "prisma/config";

function ensureSslMode(url: string): string {
  if (url.includes("sslmode=")) return url;
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
    url: ensureSslMode(directUrl),
  },
});

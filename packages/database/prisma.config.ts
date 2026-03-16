import { defineConfig, env } from "prisma/config";

function ensureSslModeForPg(url: string): string {
  const sslmodeRegex = /sslmode=[^&]*/;
  if (sslmodeRegex.test(url)) {
    return url.replace(sslmodeRegex, "sslmode=verify-full");
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sslmode=verify-full`;
}

const directUrl = process.env.DIRECT_URL ?? env("DIRECT_URL");
const isNeon = directUrl.includes(".neon.tech");

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: isNeon ? directUrl : ensureSslModeForPg(directUrl),
  },
});

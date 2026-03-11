import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.resolve(currentDir, "..");
const repoRoot = path.resolve(databaseDir, "../..");

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as Record<string, unknown>;
}

test("database package exports compiled artifacts", () => {
  const databasePackageJson = readJson("packages/database/package.json");
  const exportsMap = databasePackageJson.exports as Record<string, Record<string, string>>;

  expect(exportsMap["."]).toEqual({
    types: "./dist/index.d.ts",
    import: "./dist/index.js",
  });
  expect(exportsMap["./generated/prismabox/*"]).toEqual({
    types: "./dist/generated/prismabox/*.d.ts",
    import: "./dist/generated/prismabox/*.js",
  });
  expect(exportsMap["./generated/prisma/*"]).toEqual({
    types: "./dist/generated/prisma/*.d.ts",
    import: "./dist/generated/prisma/*.js",
  });
});

test("tsconfig path aliases do not bypass database package exports", () => {
  const webTsconfig = readJson("apps/web/tsconfig.json");
  const webPaths = (webTsconfig.compilerOptions as { paths?: Record<string, string[]> } | undefined)?.paths ?? {};

  expect(webPaths).not.toHaveProperty("@rezumerai/database");
  expect(webPaths).not.toHaveProperty("@rezumerai/database/*");
});

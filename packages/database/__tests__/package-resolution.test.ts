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
    types: "./dist/index.d.mts",
    import: "./dist/index.mjs",
  });
  expect(exportsMap["./generated/prismabox/*"]).toEqual({
    types: "./dist/generated/prismabox/*.d.mts",
    import: "./dist/generated/prismabox/*.mjs",
  });
  expect(exportsMap["./generated/prisma/*"]).toEqual({
    types: "./dist/generated/prisma/*.d.mts",
    import: "./dist/generated/prisma/*.mjs",
  });
});

test("workspace typechecks resolve the database package to source", () => {
  const webTsconfig = readJson("apps/web/tsconfig.json");
  const webPaths = (webTsconfig.compilerOptions as { paths?: Record<string, string[]> } | undefined)?.paths ?? {};
  const typesTsconfig = readJson("packages/types/tsconfig.json");
  const typesPaths = (typesTsconfig.compilerOptions as { paths?: Record<string, string[]> } | undefined)?.paths ?? {};

  expect(webPaths["@rezumerai/database"]).toEqual(["../../packages/database/index.ts"]);
  expect(webPaths["@rezumerai/database/*"]).toEqual(["../../packages/database/*"]);
  expect(typesPaths["@rezumerai/database"]).toEqual(["../database/index.ts"]);
  expect(typesPaths["@rezumerai/database/*"]).toEqual(["../database/*"]);
});

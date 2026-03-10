import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const standaloneRoot = path.join(appRoot, ".next", "standalone", "apps", "web");
const standaloneNextDir = path.join(standaloneRoot, ".next");
const sourceStaticDir = path.join(appRoot, ".next", "static");
const targetStaticDir = path.join(standaloneNextDir, "static");
const sourcePublicDir = path.join(appRoot, "public");
const targetPublicDir = path.join(standaloneRoot, "public");

function ensureDirectory(directoryPath: string): void {
  mkdirSync(directoryPath, { recursive: true });
}

function replaceWithDirectoryLink(sourcePath: string, targetPath: string): void {
  rmSync(targetPath, { force: true, recursive: true });

  try {
    symlinkSync(sourcePath, targetPath, "dir");
  } catch {
    cpSync(sourcePath, targetPath, { recursive: true });
  }
}

if (!existsSync(standaloneRoot)) {
  console.warn("Standalone build output not found. Run `bun run build` before starting the production server.");
  process.exit(0);
}

ensureDirectory(standaloneNextDir);

if (existsSync(sourceStaticDir)) {
  replaceWithDirectoryLink(sourceStaticDir, targetStaticDir);
}

if (existsSync(sourcePublicDir)) {
  replaceWithDirectoryLink(sourcePublicDir, targetPublicDir);
}

console.log("Standalone assets prepared.");

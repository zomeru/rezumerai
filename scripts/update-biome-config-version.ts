import { exec } from "node:child_process";
import { constants } from "node:fs";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execAsync: ReturnType<typeof promisify> = promisify(exec);

type BiomeConfig = {
  $schema?: string;
  [key: string]: unknown;
};

/**
 * Get installed @biomejs/biome version using Bun
 */
async function getBiomeVersion(): Promise<string> {
  const { stdout } = await execAsync("bun pm ls @biomejs/biome");

  const match = stdout.match(/@biomejs\/biome@([\d.]+)/);

  if (!match) {
    throw new Error("❌ @biomejs/biome is not installed");
  }

  console.log(`📦 Found Biome version: ${match[1]}`);

  return match[1];
}

/**
 * Find biome.json files in a folder (apps/*, packages/*)
 */
async function findBiomeConfigs(baseDir: string): Promise<string[]> {
  try {
    const entries = await readdir(baseDir, {
      withFileTypes: true,
    });

    return entries.filter((e) => e.isDirectory()).map((e) => `${baseDir}/${e.name}/biome.json`);
  } catch {
    return [];
  }
}

/**
 * Collect all biome.json targets dynamically
 */
async function getBiomeTargets(): Promise<string[]> {
  return [
    "biome.json", // root
    ...(await findBiomeConfigs("apps")),
    ...(await findBiomeConfigs("packages")),
  ];
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read biome.json safely
 */
async function readBiomeConfig(filePath: string): Promise<BiomeConfig> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

/**
 * Update biome.json with new schema (only if file exists)
 */
async function updateBiomeConfig(filePath: string, version: string): Promise<void> {
  if (!(await fileExists(filePath))) {
    return; // ⛔️ skip non-existing files
  }

  const config = await readBiomeConfig(filePath);

  const nextSchema = `https://biomejs.dev/schemas/${version}/schema.json`;

  if (config.$schema === nextSchema) {
    return; // already up to date
  }

  config.$schema = nextSchema;

  await writeFile(filePath, JSON.stringify(config, null, 2) + "\n", "utf8");

  console.log(`✅ Updated ${filePath}`);
}

/**
 * Main updater
 */
async function updateBiomeConfigVersion(): Promise<void> {
  const version = await getBiomeVersion();
  const targets = await getBiomeTargets();

  console.log(`🔧 Updating Biome configs → v${version}`);

  await Promise.all(targets.map((path) => updateBiomeConfig(resolve(path), version)));

  console.log("🎉 Done");
}

updateBiomeConfigVersion().catch((err) => {
  console.error(err);
  process.exit(1);
});

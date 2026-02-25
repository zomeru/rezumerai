import { constants } from "node:fs";
import { access, readdir, readFile, writeFile } from "node:fs/promises";

type BiomeConfig = {
  $schema?: string;
  [key: string]: unknown;
};

/**
 * Get installed @biomejs/biome version using Bun
 */
async function getBiomeVersion(): Promise<string> {
  const proc = Bun.spawn(["bun", "pm", "pkg", "get", "devDependencies"], {
    stdout: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const devDeps = JSON.parse(stdout) as Record<string, string>;

  const version = devDeps["@biomejs/biome"];

  if (!version) {
    throw new Error("❌ @biomejs/biome is not installed");
  }

  // version might be "^2.4.4" or "2.4.4"
  const cleanVersion = version.replace(/^[^\d]*/, "");

  console.log(`📦 Found Biome version: ${cleanVersion}`);
  return cleanVersion;
}

/**
 * Find biome.json files in a folder (apps/*, packages/*)
 */
async function findBiomeConfigs(baseDir: string): Promise<string[]> {
  try {
    const entries = await readdir(baseDir, { withFileTypes: true });

    return entries
      .filter((e) => e.isDirectory())
      .map((e) => `${baseDir}/${e.name}/biome.json`);
  } catch {
    return [];
  }
}

/**
 * Collect all biome.json targets dynamically
 */
async function getBiomeTargets(): Promise<string[]> {
  return [
    "biome.json",
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
async function readBiomeConfig(path: string): Promise<BiomeConfig> {
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * Update biome.json with new schema
 */
async function updateBiomeConfig(path: string, version: string): Promise<void> {
  if (!(await fileExists(path))) return;

  const config = await readBiomeConfig(path);
  const nextSchema = `https://biomejs.dev/schemas/${version}/schema.json`;

  if (config.$schema === nextSchema) return;

  config.$schema = nextSchema;
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`✅ Updated ${path}`);
}

/**
 * Main updater
 */
async function updateBiomeConfigVersion(): Promise<void> {
  const version = await getBiomeVersion();
  const targets = await getBiomeTargets();

  console.log(`🔧 Updating Biome configs → v${version}`);

  await Promise.all(targets.map((p) => updateBiomeConfig(p, version)));

  console.log("🎉 Done");
}

updateBiomeConfigVersion().catch((err) => {
  console.error(err);
  process.exit(1);
});

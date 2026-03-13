import { describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bootstrapSystemConfigurations,
  getRequiredSystemConfigurationSeeds,
  seedSystemConfigurations,
} from "../scripts/system-configurations";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.resolve(currentDir, "..");
const repoRoot = path.resolve(databaseDir, "../..");

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as Record<string, unknown>;
}

function createMockDb() {
  return {
    systemConfiguration: {
      upsert: mock(async () => undefined),
    },
  };
}

describe("system configuration bootstrap", () => {
  it("creates every required system configuration entry without overwriting existing values", async () => {
    const db = createMockDb();
    const seeds = getRequiredSystemConfigurationSeeds();

    await bootstrapSystemConfigurations(db as never);

    expect(db.systemConfiguration.upsert).toHaveBeenCalledTimes(seeds.length);

    for (const [index, seed] of seeds.entries()) {
      expect(db.systemConfiguration.upsert).toHaveBeenNthCalledWith(index + 1, {
        where: { name: seed.name },
        update: {},
        create: {
          name: seed.name,
          description: seed.description,
          value: seed.value,
        },
      });
    }
  });

  it("keeps the development seed behavior that rewrites existing values to the current defaults", async () => {
    const db = createMockDb();
    const seeds = getRequiredSystemConfigurationSeeds();

    await seedSystemConfigurations(db as never);

    expect(db.systemConfiguration.upsert).toHaveBeenCalledTimes(seeds.length);

    for (const [index, seed] of seeds.entries()) {
      expect(db.systemConfiguration.upsert).toHaveBeenNthCalledWith(index + 1, {
        where: { name: seed.name },
        update: {
          description: seed.description,
          value: seed.value,
        },
        create: {
          name: seed.name,
          description: seed.description,
          value: seed.value,
        },
      });
    }
  });
});

describe("database deploy scripts", () => {
  it("runs required system bootstrap after migrate deploy commands", () => {
    const databasePackageJson = readJson("packages/database/package.json");
    const scripts = databasePackageJson.scripts as Record<string, string>;

    expect(scripts["db:bootstrap:system"]).toContain("system-bootstrap.ts");
    expect(scripts["db:bootstrap:system:preview"]).toContain("system-bootstrap.ts");
    expect(scripts["db:bootstrap:system:prod"]).toContain("system-bootstrap.ts");
    expect(scripts["db:migrate"]).toContain("db:bootstrap:system");
    expect(scripts["db:migrate:preview"]).toContain("db:bootstrap:system:preview");
    expect(scripts["db:migrate:prod"]).toContain("db:bootstrap:system:prod");
  });
});

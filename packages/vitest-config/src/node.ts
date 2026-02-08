import { defineConfig, mergeConfig } from "vitest/config";
import { createBaseConfig } from "./base";

export const createNodeConfig = (dirname: string): Record<string, unknown> =>
  mergeConfig(
    createBaseConfig(dirname),
    defineConfig({
      test: {
        environment: "node",
      },
    }),
  );

export const nodeConfig: ReturnType<typeof defineConfig> = defineConfig(createNodeConfig(__dirname));

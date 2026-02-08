import { defineConfig, mergeConfig } from "vitest/config";
import { createBaseConfig } from "./base";

// biome-ignore lint/nursery/useExplicitType: Vitest config type inference required
export const createNodeConfig = (dirname: string) =>
  mergeConfig(
    createBaseConfig(dirname),
    defineConfig({
      test: {
        environment: "node",
      },
    }),
  );

export const nodeConfig: ReturnType<typeof defineConfig> = defineConfig(createNodeConfig(__dirname));

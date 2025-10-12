import { defineConfig, mergeConfig } from "vitest/config";
import { createBaseConfig } from "./base";

export const createNodeConfig = (dirname: string) =>
  mergeConfig(
    createBaseConfig(dirname),
    defineConfig({
      test: {
        environment: "node",
      },
    }),
  );

export const nodeConfig = defineConfig(createNodeConfig(__dirname));

import { defineConfig, mergeConfig } from "vitest/config";
import { createBaseConfig } from "./base";

export const createReactConfig = (dirname: string) =>
  mergeConfig(
    createBaseConfig(dirname),
    defineConfig({
      test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        css: true,
        globals: true,
      },
      esbuild: {
        jsxInject: "import React from 'react'",
      },
      define: {
        global: "globalThis",
      },
    }),
  );

export const reactConfig = defineConfig(createReactConfig(__dirname));

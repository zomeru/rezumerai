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
      },
      esbuild: {
        jsxInject: "import React from 'react'",
      },
    }),
  );

export const reactConfig = defineConfig(createReactConfig(__dirname));

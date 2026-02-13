import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";
import { createBaseConfig } from "./base";

/**
 * Creates a Vitest configuration for React component testing.
 * Extends the base config with jsdom environment, React Testing Library setup,
 * CSS support, and JSX injection.
 *
 * @param dirname - Absolute path to the package directory (typically `__dirname`)
 * @returns Vitest configuration object for React testing
 *
 * @example
 * ```ts
 * import { createReactConfig } from "@rezumerai/vitest-config";
 * export default defineConfig(createReactConfig(__dirname));
 * ```
 */
export const createReactConfig = (dirname: string): ViteUserConfig =>
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

/**
 * Pre-built React Vitest configuration using the current directory.
 * Import directly when no custom dirname is needed.
 */
export const reactConfig: ViteUserConfig = createReactConfig(__dirname);

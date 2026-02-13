import path from "node:path";
import { defineConfig, type ViteUserConfig } from "vitest/config";

/**
 * Creates a base Vitest configuration with shared defaults.
 * Includes coverage settings, path aliases, and global test configuration.
 *
 * @param dirname - Absolute path to the package directory (typically `__dirname`)
 * @returns Vitest configuration object with base settings
 *
 * @example
 * ```ts
 * import { createBaseConfig } from "@rezumerai/vitest-config";
 * export default defineConfig(createBaseConfig(__dirname));
 * ```
 */
export const createBaseConfig = (dirname: string): ViteUserConfig =>
  defineConfig({
    test: {
      globals: true,
      coverage: {
        provider: "v8" as const,
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.d.ts",
          "**/*.config.{js,ts,mjs}",
          "**/coverage/**",
          "**/dist/**",
          "**/*.test.{js,ts,jsx,tsx}",
          "**/*.spec.{js,ts,jsx,tsx}",
        ],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(dirname, "./src"),
      },
    },
    define: {
      global: "globalThis",
    },
  });

/**
 * Pre-built base Vitest configuration using the current directory.
 * Import directly when no custom dirname is needed.
 */
export const baseConfig: ViteUserConfig = createBaseConfig(__dirname);

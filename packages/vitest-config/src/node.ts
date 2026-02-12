import { defineConfig, mergeConfig } from "vitest/config";
import { createBaseConfig } from "./base";

/**
 * Creates a Vitest configuration for Node.js testing.
 * Extends the base config with the Node environment.
 *
 * @param dirname - Absolute path to the package directory (typically `__dirname`)
 * @returns Vitest configuration object for Node testing
 *
 * @example
 * ```ts
 * import { createNodeConfig } from "@rezumerai/vitest-config";
 * export default defineConfig(createNodeConfig(__dirname));
 * ```
 */
export const createNodeConfig = (dirname: string): Record<string, unknown> =>
  mergeConfig(
    createBaseConfig(dirname),
    defineConfig({
      test: {
        environment: "node",
      },
    }),
  );

/**
 * Pre-built Node.js Vitest configuration using the current directory.
 * Import directly when no custom dirname is needed.
 */
export const nodeConfig: ReturnType<typeof defineConfig> = defineConfig(createNodeConfig(__dirname));

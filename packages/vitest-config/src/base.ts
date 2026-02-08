import path from "node:path";
import { defineConfig } from "vitest/config";

export const createBaseConfig = (dirname: string): Record<string, unknown> => ({
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

export const baseConfig: ReturnType<typeof defineConfig> = defineConfig(createBaseConfig(__dirname));

import path from "node:path";
import { defineConfig } from "vitest/config";

export const createBaseConfig = (dirname: string) => ({
  test: {
    globals: true,
    coverage: {
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

export const baseConfig = defineConfig(createBaseConfig(__dirname));

import path from "node:path";
import { defineConfig } from "vitest/config";

// biome-ignore lint/nursery/useExplicitType: Vitest config type inference required
export const createBaseConfig = (dirname: string) => ({
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

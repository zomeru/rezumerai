import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts", "!src/**/__tests__/**", "!src/test/**"],
  format: ["esm"],
  dts: { resolve: true },
  splitting: false,
  sourcemap: true,
  clean: true,
  tsconfig: "./tsconfig.json",
  outExtension({ format }: { format: string }): { js: string } {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/**/*.spec.ts",
    "!src/**/*.spec.tsx",
    "!src/**/__tests__/**",
    "!src/test/**",
  ],
  format: ["esm"],
  dts: process.env.NODE_ENV === "development" ? { resolve: true } : false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["clsx", "tailwind-merge"],
  tsconfig: "./tsconfig.json",
  outExtension({ format }: { format: string }): { js: string } {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

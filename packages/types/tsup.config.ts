import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: process.env.NODE_ENV !== "production" ? { resolve: true } : false,
  splitting: false,
  sourcemap: true,
  clean: true,
  tsconfig: "./tsconfig.json",
  outExtension({ format }: { format: string }): { js: string } {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

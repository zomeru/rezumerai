import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: process.env.NODE_ENV === "development",
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["./generated/**"],
  outExtension({ format }: { format: string }): { js: string } {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: false, // Disable DTS generation due to Prisma client compatibility issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["./generated/**"],
  outExtension({ format }) {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

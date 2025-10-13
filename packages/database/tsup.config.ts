import { defineConfig } from "tsup";

export default defineConfig(() => ({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  dts: false, // Disable DTS generation due to Prisma client compatibility issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["@prisma/client"],
}));

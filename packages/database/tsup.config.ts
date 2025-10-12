import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  dts: !options.watch, // Disable DTS generation in watch mode to prevent infinite loops
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["@prisma/client"],
}));

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/styles.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["clsx", "tailwind-merge"],
});

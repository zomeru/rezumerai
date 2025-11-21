import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    resolve: true,
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  tsconfig: "./tsconfig.json",
  outExtension({ format }) {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

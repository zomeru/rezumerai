import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    base: "src/base.ts",
    node: "src/node.ts",
    react: "src/react.ts",
  },
  format: ["cjs", "esm"],
  dts: process.env.NODE_ENV === "development" ? { resolve: true } : false,
  clean: true,
  target: "esnext",
  tsconfig: "./tsconfig.json",
  outExtension({ format }: { format: string }): { js: string } {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

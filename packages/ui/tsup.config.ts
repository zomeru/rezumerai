import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.tsx",
    components: "src/components/index.tsx",
  },
  format: ["esm"],
  dts: process.env.NODE_ENV !== "production" ? { resolve: true } : false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  tsconfig: "./tsconfig.json",
  outExtension({ format }: { format: string }): { js: string } {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});

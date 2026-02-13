import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    styles: "src/styles.ts",
    string: "src/string.ts",
    date: "src/date.ts",
  },
  format: ["esm"],
  dts: process.env.NODE_ENV !== "production" ? { resolve: true } : false,
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

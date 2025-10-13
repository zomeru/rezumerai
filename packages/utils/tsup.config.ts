import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    styles: "src/styles.ts",
    string: "src/string.ts",
    date: "src/date.ts",
    // Add more utilities here as you create them
    // Example: "validation": "src/validation.ts",
    // Example: "api": "src/api.ts",
  },
  format: ["cjs", "esm"],
  dts: {
    resolve: true,
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["clsx", "tailwind-merge"],
});

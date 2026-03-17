import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/**/*.spec.ts",
    "!src/**/*.spec.tsx",
    "!src/**/__tests__/**",
    "!src/test/**",
    "!src/**/*.d.ts",
  ],
  format: "esm",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ["clsx", "tailwind-merge"],
  },
  tsconfig: "./tsconfig.json",
});

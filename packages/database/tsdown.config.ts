import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["index.ts", "generated/prisma/**/*.ts", "generated/prismabox/**/*.ts"],
  format: "esm",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ["@prisma/client", "@prisma/adapter-pg", /^@prisma\//],
    onlyBundle: false,
  },
});

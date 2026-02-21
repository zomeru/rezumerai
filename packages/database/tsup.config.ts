import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "generated/prisma/**/*.ts", "!generated/prisma/**/*.test.ts", "!generated/prisma/**/*.spec.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: false, // Transpile only, don't bundle
  external: [
    "@prisma/client",
    "@prisma/adapter-pg",
    /^@prisma\//, // Keep @prisma/* packages external
  ],
  // Output .js for ESM to match import statements
  outExtension: () => ({ js: ".js" }),
});

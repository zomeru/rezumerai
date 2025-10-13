import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/base.ts", "src/node.ts", "src/react.ts"],
  format: ["cjs", "esm"],
  dts: {
    resolve: true,
  },
  clean: true,
  target: "esnext",
  tsconfig: "./tsconfig.json",
});

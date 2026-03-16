import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.tsx",
    components: "src/components/index.tsx",
  },
  format: "esm",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ["react", "react-dom"],
  },
  tsconfig: "./tsconfig.json",
});

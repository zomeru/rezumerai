import { defineConfig } from "tsup";

export default defineConfig({
  // entry: ["src/index.ts"],
  entry: {
    index: "src/index.tsx",
    components: "src/components/index.tsx",
  },
  format: ["cjs", "esm"],
  dts: {
    resolve: true,
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
});

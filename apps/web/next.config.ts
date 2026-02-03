import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  transpilePackages: ["@rezumerai/ui"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    remotePatterns: [
      new URL("https://images.unsplash.com/**"),
      new URL("https://avatars.githubusercontent.com/**"),
      new URL("https://cdn.jsdelivr.net/**"),
      new URL("https://avatars.githubusercontent.com/u/19688908?v=4"),
      new URL("https://raw.githubusercontent.com/prebuiltui/**"),
    ],
  },
};

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@rezumerai/ui"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    domains: [
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "cdn.jsdelivr.net",
    ],
  },
};

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);

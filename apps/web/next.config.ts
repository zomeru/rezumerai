import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  transpilePackages: ["@rezumerai/ui"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Image optimization
  images: {
    remotePatterns: [
      new URL("https://images.unsplash.com/**"),
      new URL("https://avatars.githubusercontent.com/**"),
      new URL("https://cdn.jsdelivr.net/**"),
      new URL("https://avatars.githubusercontent.com/u/19688908?v=4"),
      new URL("https://raw.githubusercontent.com/prebuiltui/**"),
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers (production only - middleware handles CSP)
  async headers(): Promise<
    Array<{
      source: string;
      headers: Array<{ key: string; value: string }>;
    }>
  > {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ["@rezumerai/ui", "@rezumerai/utils"],
  },

  // Compiler options for React 19
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

const withBundleAnalyzer: (config: typeof nextConfig) => typeof nextConfig = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);

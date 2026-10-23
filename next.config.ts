import type { NextConfig } from "next";

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingIncludes: {
    "/api/shop/download": ["./private-downloads/**"],
  },
  async rewrites() {
    return [
      { source: "/book/:token", destination: "/" },
      { source: "/b/:slug", destination: "/" },
      { source: "/shop", destination: "/shop.html" },
    ];
  },
} as NextConfig;

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingIncludes: {
    "/api/shop/download": ["./private-downloads/**"],
  },
  async rewrites() {
    return [
      { source: "/book/:token", destination: "/" },
      { source: "/shop", destination: "/shop.html" },
    ];
  },
};

export default nextConfig;

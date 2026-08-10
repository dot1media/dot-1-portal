import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Migration mode: the ported portal is JavaScript-flavored, so we relax
  // strict TypeScript/ESLint build gating for now. We can tighten this later
  // once the code is converted to typed TSX.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

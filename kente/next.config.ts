import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the Playwright build use its own output folder alongside `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;

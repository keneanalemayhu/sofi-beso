// @/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  allowedDevOrigins: ["local.sofi-beso.et"],
};

export default nextConfig;
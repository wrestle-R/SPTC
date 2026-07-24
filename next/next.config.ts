import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.105"],
  transpilePackages: ["@sports-fiesta/domain", "@sports-fiesta/theme"],
  turbopack: { root: __dirname },
};

export default nextConfig;

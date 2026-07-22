import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sports-fiesta/domain", "@sports-fiesta/theme"],
};

export default nextConfig;

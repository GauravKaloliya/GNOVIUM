import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/api/v1/docs",
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

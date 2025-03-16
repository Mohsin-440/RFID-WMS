import type { NextConfig } from "next";
import path from "path";
const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias['@wsm/shared'] = path.resolve(__dirname, '../shared/dist');
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ], // Allow localhost images
  },
};

export default nextConfig;

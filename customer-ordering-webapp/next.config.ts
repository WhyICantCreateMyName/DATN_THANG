import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['www.thanhcanghaiphong.online', 'https://www.thanhcanghaiphong.online', 'thanhcanghaiphong.online', 'https://thanhcanghaiphong.online'],
  
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;

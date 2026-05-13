import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.0.102:4000/:path*',
      },
    ];
  },
  // Allow Cloudflare Tunnel domain for HMR
  allowedDevOrigins: ['ql.nhahang.website', 'https://ql.nhahang.website'],
  
  webpack: (config, { dev, isServer }) => {
    // Optimization for HMR over tunnel/proxy
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

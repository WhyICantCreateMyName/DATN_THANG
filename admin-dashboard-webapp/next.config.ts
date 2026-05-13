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
  allowedDevOrigins: ['https://ql.nhahang.website']
};

export default nextConfig;

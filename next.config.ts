import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... other config options
  rewrites: async () => {
    return [
      {
        source: '/',
        destination: '/api/proxy/',
      },
      {
        source: '/:path*',
        destination: '/api/proxy/:path*',
      },
    ];
  },
};

export default nextConfig;

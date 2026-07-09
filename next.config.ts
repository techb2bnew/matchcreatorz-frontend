import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', '@reduxjs/toolkit', 'react-redux', 'react-hot-toast'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'matchcreatorz.com' },
    ],
  },
};

export default nextConfig;

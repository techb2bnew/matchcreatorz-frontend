import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', '@reduxjs/toolkit', 'react-redux', 'react-hot-toast'],
  },
  allowedDevHosts: [
    '.ngrok-free.app',
    '.ngrok-free.dev',
    '.ngrok.io',
    'localhost',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'matchcreatorz.com' },
      { protocol: 'https', hostname: '*.ngrok-free.app' },
      { protocol: 'https', hostname: '*.ngrok-free.dev' },
    ],
  },
};

export default nextConfig;

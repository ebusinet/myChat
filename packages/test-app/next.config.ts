import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@mychat/client', '@mychat/server', '@mychat/shared'],
};

export default nextConfig;

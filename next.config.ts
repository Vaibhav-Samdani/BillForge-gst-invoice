import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during builds for generated files
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib', 'hooks']
  },
  typescript: {
    // Ignore TypeScript errors during builds for generated files
    ignoreBuildErrors: false
  }
};

export default nextConfig;

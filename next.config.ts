import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      ...(process.env.MEDIA_SERVER_URL ? [{ source: '/media-service/api/:path*', destination: `${process.env.MEDIA_SERVER_URL.replace(/\/$/, '')}/api/:path*` }] : []),
      {
      source: '/api/v1/:path*',
      destination: `${process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1'}/:path*`,
    }];
  },
};

export default nextConfig;

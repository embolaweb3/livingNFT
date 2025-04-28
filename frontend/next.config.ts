import type { NextConfig } from "next";
import * as dotenv from 'dotenv'
dotenv.config()

const nextConfig: NextConfig = {
  experimental: {
    turbo: false,
  },  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || '',
          },
        ],
      },
    ];
  },
};
 export default nextConfig;
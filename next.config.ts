import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/calc',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;

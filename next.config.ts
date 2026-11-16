import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // lets phones on the same network open the dev server (npm run dev -- -H 0.0.0.0)
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '10.*.*.*'],
};

export default nextConfig;

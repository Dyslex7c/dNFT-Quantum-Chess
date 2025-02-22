import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Important: Return the modified config
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      readline: false,
      stream: false,
    };
    return config;
  },
  images: {
    domains: ["aqua-past-reindeer-831.mypinata.cloud","lavender-main-tiger-401.mypinata.cloud"],
  },
};

export default nextConfig;

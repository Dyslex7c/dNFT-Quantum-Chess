import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Important: Return the modified config
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      readline: false,
      stream: require.resolve("stream-browserify"),
      crypto: require.resolve("crypto-browserify"),
      net: false,
      tls: false,
      "process/browser": require.resolve("process/browser"),
      buffer: require.resolve("buffer/")
    };
    
    // Add polyfill for global objects
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        process: "process/browser",
      };
    }
    
    return config;
  },
  images: {
    domains: ["aqua-past-reindeer-831.mypinata.cloud", "lavender-main-tiger-401.mypinata.cloud", "amaranth-secondary-lungfish-281.mypinata.cloud"],
  },
};

export default nextConfig;
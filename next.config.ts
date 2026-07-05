import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    // Root-level on purpose — see the note in cloudinary-image-loader.ts.
    loaderFile: "./cloudinary-image-loader.ts",
    qualities: [60, 75],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;

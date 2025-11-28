import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fl-admin-apps.s3.eu-west-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
    domains: ["res.cloudinary.com", "fl-admin-apps.s3.eu-west-2.amazonaws.com"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Next doesn't mis-detect it from a stray lockfile
  // in a parent directory (which broke Turbopack module resolution on Windows).
  turbopack: {
    root: __dirname,
  },
  // Load the AWS SDK from node_modules at runtime instead of bundling it. Keeps
  // the server bundle small and avoids Turbopack symlinking the package (which
  // fails on Windows without symlink privilege).
  serverExternalPackages: ["@aws-sdk/client-s3"],
  // Allow the dev server to be reached from this machine's LAN address (e.g. a
  // phone on the same network), not just localhost. Adjust the IP if it changes.
  allowedDevOrigins: ["10.5.0.2"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        // S3 bucket holding migrated cover/review images
        protocol: "https",
        hostname: "robs-booky-data.s3.eu-west-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
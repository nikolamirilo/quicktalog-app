import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/flags",
        destination: "https://eu.i.posthog.com/flags",
      },
    ]
  },
  skipTrailingSlashRedirect: true,
  logging: false,
}

export default nextConfig

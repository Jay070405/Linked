import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["gsap"],
  outputFileTracingRoot: process.cwd(),
}

export default nextConfig

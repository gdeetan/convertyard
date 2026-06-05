import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // wasm-vips must not be bundled for the server/edge runtimes
  serverExternalPackages: ['wasm-vips'],
}

export default nextConfig

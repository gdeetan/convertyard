import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // wasm-vips must not be bundled for the server/edge runtimes
  serverExternalPackages: ['wasm-vips'],
  // COOP/COEP headers are required for SharedArrayBuffer (wasm-vips threading).
  // In production these come from public/_headers (Cloudflare Pages).
  // In dev mode next.config headers() is the only way to set them.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
  webpack(config) {
    // wasm-vips is an Emscripten ES module that uses import.meta.
    // Without this, webpack can't parse vips-es6.js in the main bundle context.
    config.module.rules.push({
      test: /node_modules\/wasm-vips\/.+\.js$/,
      type: 'javascript/esm',
    })
    return config
  },
}

export default nextConfig

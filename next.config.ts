import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // wasm-vips must not be bundled for the server/edge runtimes
  serverExternalPackages: ['wasm-vips'],
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

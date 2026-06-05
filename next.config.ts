import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // wasm-vips uses import.meta — must not be bundled by Next.js server/flight bundler
  serverExternalPackages: ['wasm-vips'],
  webpack(config, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    // wasm-vips is an Emscripten ES module using import.meta.
    // Mark it as type 'javascript/esm' so webpack parses it correctly.
    config.module.rules.push({
      test: /node_modules\/wasm-vips\/.+\.js$/,
      type: 'javascript/esm',
    })
    // Exclude from server bundle — only runs in the browser
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'wasm-vips',
      ]
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(tools)/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}

export default nextConfig

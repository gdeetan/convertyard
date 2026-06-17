import type { NextConfig } from 'next'
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
})

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // wasm-vips must not be bundled for server/edge runtimes.
  // mupdf is loaded at runtime from /public/ — not bundled at all.
  serverExternalPackages: ['wasm-vips', '@ffmpeg/ffmpeg', '@huggingface/transformers'],
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
  webpack(config, { webpack, isServer }) {
    // wasm-vips is an Emscripten ES module that uses import.meta.
    // Without this, webpack can't parse vips-es6.js in the main bundle context.
    config.module.rules.push({
      test: /node_modules\/wasm-vips\/.+\.js$/,
      type: 'javascript/esm',
    })
    // Inject HF auth token into the worker bundle at build time.
    // Set HF_TOKEN in Cloudflare Pages env variables (Settings → Environment variables).
    config.plugins.push(new webpack.DefinePlugin({
      __HF_TOKEN__: JSON.stringify(process.env.HF_TOKEN ?? ''),
    }))
    // pptxgenjs's ES module build references node:fs/node:https.
    // Redirect to the self-contained browser bundle which excludes Node built-ins.
    if (!isServer) {
      // Use path.join to bypass the exports map restriction on subpath access
      config.resolve.alias['pptxgenjs'] =
        require('path').join(__dirname, 'node_modules/pptxgenjs/dist/pptxgen.bundle.js')
      // pptxgen.bundle.js references node:fs and node:https for its Node.js file-write
      // and remote-image-fetch code paths. In the browser those paths are never executed.
      // Strip the node: prefix so webpack's normal fallback (false) suppresses them.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, '')
        })
      )
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        os: false,
        path: false,
      }
    }
    return config
  },
}

export default withMDX(nextConfig)

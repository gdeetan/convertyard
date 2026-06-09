// Dynamic import keeps @ffmpeg/ffmpeg out of all other pages' bundles.
// Core files are loaded from CDN via toBlobURL to work around:
//  1. Cloudflare Pages 25 MiB file size limit (ffmpeg-core.wasm is ~30 MB)
//  2. COEP require-corp restriction on cross-origin WASM

const CDN = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadPromise: Promise<any> | null = null

export function preloadFFmpeg(): void {
  getFFmpeg().catch(() => {})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFFmpeg(): Promise<any> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CDN}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CDN}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      return ffmpeg
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }
  return loadPromise
}

// Dynamic import keeps @ffmpeg/ffmpeg out of all other pages' bundles.
// Core files are loaded from CDN via toBlobURL to work around:
//  1. Cloudflare Pages 25 MiB file size limit (ffmpeg-core.wasm is ~30 MB)
//  2. COEP require-corp restriction on cross-origin WASM

const CDN_MT = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd'
const CDN_ST = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'

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

      if (typeof SharedArrayBuffer !== 'undefined') {
        try {
          const ffmpeg = new FFmpeg()
          await ffmpeg.load({
            coreURL: await toBlobURL(`${CDN_MT}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${CDN_MT}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${CDN_MT}/ffmpeg-core.worker.js`, 'text/javascript'),
          })
          return ffmpeg
        } catch (err) {
          console.warn('[ffmpeg] multi-thread core failed, falling back to single-thread:', err)
        }
      }

      // Single-thread fallback (SAB unavailable or MT load failed)
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CDN_ST}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CDN_ST}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      return ffmpeg
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }
  return loadPromise
}

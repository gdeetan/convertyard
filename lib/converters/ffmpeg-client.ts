// Dynamic import keeps @ffmpeg/ffmpeg out of all other pages' bundles.
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
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: '/ffmpeg-core.js',
        wasmURL: '/ffmpeg-core.wasm',
      })
      return ffmpeg
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }
  return loadPromise
}

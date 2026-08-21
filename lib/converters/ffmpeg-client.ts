// Dynamic import keeps @ffmpeg/ffmpeg out of all other pages' bundles.
// Core files are loaded from CDN via toBlobURL to work around:
//  1. Cloudflare Pages 25 MiB file size limit (ffmpeg-core.wasm is ~30 MB)
//  2. COEP require-corp restriction on cross-origin WASM

const CDN_MT = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd'
const CDN_ST = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'

// Cache the ~25 MB ffmpeg-core assets in Cache Storage so mobile Safari
// (which evicts HTTP cache aggressively) hits an instant second load.
// Cache name embeds the core version — bumping the CDN URL naturally invalidates.
const FFMPEG_CACHE = 'convertyard-ffmpeg-core-v1'

async function fetchCachedBlobURL(url: string, mime: string): Promise<string> {
  const { toBlobURL } = await import('@ffmpeg/util')
  if (typeof caches === 'undefined') return toBlobURL(url, mime)
  try {
    const cache = await caches.open(FFMPEG_CACHE)
    const hit = await cache.match(url)
    if (hit) {
      const blob = new Blob([await hit.arrayBuffer()], { type: mime })
      return URL.createObjectURL(blob)
    }
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    // Clone before consuming: cache.put needs an unread body, blob() reads it.
    cache.put(url, res.clone()).catch(() => { /* quota / opaque — ignore */ })
    const blob = new Blob([await res.arrayBuffer()], { type: mime })
    return URL.createObjectURL(blob)
  } catch {
    return toBlobURL(url, mime)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadPromise: Promise<any> | null = null
// Separate ST-only instance for filter-heavy operations (drawtext etc.).
// @ffmpeg/core-mt deadlocks Chrome/Safari on any -vf filter graph (issue #772).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stLoadPromise: Promise<any> | null = null

export function preloadFFmpeg(): void {
  getFFmpeg().catch(() => {})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFFmpeg(): Promise<any> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')

      if (typeof SharedArrayBuffer !== 'undefined') {
        try {
          const ffmpeg = new FFmpeg()
          await ffmpeg.load({
            coreURL: await fetchCachedBlobURL(`${CDN_MT}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await fetchCachedBlobURL(`${CDN_MT}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await fetchCachedBlobURL(`${CDN_MT}/ffmpeg-core.worker.js`, 'text/javascript'),
          })
          return ffmpeg
        } catch (err) {
          console.warn('[ffmpeg] multi-thread core failed, falling back to single-thread:', err)
        }
      }

      // Single-thread fallback (SAB unavailable or MT load failed)
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: await fetchCachedBlobURL(`${CDN_ST}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await fetchCachedBlobURL(`${CDN_ST}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      return ffmpeg
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }
  return loadPromise
}

// Always single-threaded — use for any command that runs a -vf filter graph.
// The MT build deadlocks Chrome/Safari on filter ops (ffmpegwasm/ffmpeg.wasm#772).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSingleThreadFFmpeg(): Promise<any> {
  if (!stLoadPromise) {
    stLoadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: await fetchCachedBlobURL(`${CDN_ST}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await fetchCachedBlobURL(`${CDN_ST}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      return ffmpeg
    })().catch((err) => {
      stLoadPromise = null
      throw err
    })
  }
  return stLoadPromise
}

// Compress-video always uses the ST core. The MT build deadlocks on -vf scale
// (ffmpegwasm#772) and was measured slower than ST even without filters.
// Pages must preload this getter — not getFFmpeg() — so the first encode does
// not download a second unused ~25 MB core.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCompressVideoFFmpeg(): Promise<any> {
  return getSingleThreadFFmpeg()
}

export function preloadCompressVideoFFmpeg(): void {
  getCompressVideoFFmpeg().catch(() => {})
}

// Mobile always gets ST: the MT build deadlocks on Android Chrome on certain
// encode paths, and ST is safer at no meaningful speed cost for mobile workloads.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mobileLoadPromise: Promise<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMobileFFmpeg(): Promise<any> {
  if (!mobileLoadPromise) {
    mobileLoadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: await fetchCachedBlobURL(`${CDN_ST}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await fetchCachedBlobURL(`${CDN_ST}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      return ffmpeg
    })().catch((err) => {
      mobileLoadPromise = null
      throw err
    })
  }
  return mobileLoadPromise
}

async function resetLoaded(
  getter: () => Promise<unknown> | null,
  clear: () => void,
): Promise<void> {
  const pending = getter()
  clear()
  if (!pending) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ffmpeg = await pending as { terminate: () => void }
    ffmpeg.terminate()
  } catch {
    /* load failed or already dead */
  }
}

// Serializes access to the shared ffmpeg-wasm instance. Needed once compressVideo
// runs files concurrently: ffmpeg.on('progress', ...) is a single-listener API
// and cv_in_N/cv_out_N tempfile names collide if two encodes overlap.
let ffmpegLock: Promise<void> = Promise.resolve()
export async function withFfmpegLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = ffmpegLock
  let release: () => void = () => {}
  ffmpegLock = new Promise<void>((resolve) => { release = resolve })
  await prev
  try {
    return await fn()
  } finally {
    release()
  }
}

/** Kill the multi-thread/default instance (used for audio extract). */
export function resetFFmpeg(): Promise<void> {
  return resetLoaded(() => loadPromise, () => { loadPromise = null })
}

/** Kill the single-thread instance (used for caption burn). */
export function resetSingleThreadFFmpeg(): Promise<void> {
  return resetLoaded(() => stLoadPromise, () => { stLoadPromise = null })
}

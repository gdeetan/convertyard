/// <reference lib="webworker" />

// Per-worker decode cache. Same fingerprint → skip decode on subsequent rungs.
// Cap matches the main-thread cache so a huge scan doesn't balloon memory.
const JPEG_CACHE_MAX_PIXELS = 25_000_000
type Entry = { canvas: OffscreenCanvas }
const cache = new Map<string, Entry>()

type EncodeReq = {
  type: 'encode'
  reqId: number
  fingerprint: string
  jpegBytes: Uint8Array
  quality: number
}

type EncodeRes =
  | { type: 'encoded'; reqId: number; bytes: Uint8Array }
  | { type: 'error'; reqId: number; message: string }

self.addEventListener('message', async (ev: MessageEvent<EncodeReq>) => {
  const msg = ev.data
  if (msg.type !== 'encode') return
  const { reqId, fingerprint, jpegBytes, quality } = msg
  try {
    let entry = cache.get(fingerprint)
    if (!entry) {
      const blob = new Blob([jpegBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
      const bmp = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(bmp.width, bmp.height)
      canvas.getContext('2d')!.drawImage(bmp, 0, 0)
      bmp.close()
      if (canvas.width * canvas.height <= JPEG_CACHE_MAX_PIXELS) {
        entry = { canvas }
        cache.set(fingerprint, entry)
      } else {
        const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
        const out = new Uint8Array(await outBlob.arrayBuffer())
        const res: EncodeRes = { type: 'encoded', reqId, bytes: out }
        ;(self as unknown as Worker).postMessage(res, [out.buffer])
        return
      }
    }
    const outBlob = await entry.canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
    const out = new Uint8Array(await outBlob.arrayBuffer())
    const res: EncodeRes = { type: 'encoded', reqId, bytes: out }
    ;(self as unknown as Worker).postMessage(res, [out.buffer])
  } catch (err) {
    const res: EncodeRes = {
      type: 'error',
      reqId,
      message: err instanceof Error ? err.message : String(err),
    }
    ;(self as unknown as Worker).postMessage(res)
  }
})

/// <reference lib="webworker" />

// Bilevel encode worker: JPEG bytes → 1-bpp packed bitmap → CCITT Group 4.
// Runs off the main thread because the per-pixel threshold loop and the
// Group 4 encoder each burn tens of ms per page — enough to freeze the UI
// on multi-page scans (P3 stalled Chrome at 55%).
import { encodeG4 } from '@/lib/pdf/ccitt-g4-encode'

type EncodeReq = {
  type: 'encode'
  reqId: number
  jpegBytes: Uint8Array
}
type EncodeRes =
  | { type: 'encoded'; reqId: number; ccittBytes: Uint8Array; width: number; height: number }
  | { type: 'error'; reqId: number; message: string }

self.onmessage = async (ev: MessageEvent<EncodeReq>) => {
  const msg = ev.data
  if (msg.type !== 'encode') return
  try {
    const blob = new Blob([msg.jpegBytes], { type: 'image/jpeg' })
    const bmp = await createImageBitmap(blob)
    const w = bmp.width
    const h = bmp.height
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    bmp.close()
    const img = ctx.getImageData(0, 0, w, h)
    const data = img.data

    const rowBytes = Math.ceil(w / 8)
    const packed = new Uint8Array(rowBytes * h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        // Rec. 709 luma; threshold 176 biases toward white background so
        // thin strokes survive on faintly-off-white scans.
        const luma = data[idx] * 0.2126 + data[idx + 1] * 0.7152 + data[idx + 2] * 0.0722
        if (luma >= 176) packed[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7)
      }
    }

    const ccittBytes = encodeG4(packed, w, h)
    const res: EncodeRes = { type: 'encoded', reqId: msg.reqId, ccittBytes, width: w, height: h }
    ;(self as unknown as { postMessage: (m: unknown, transfer?: Transferable[]) => void }).postMessage(
      res,
      [ccittBytes.buffer]
    )
  } catch (e) {
    const res: EncodeRes = {
      type: 'error',
      reqId: msg.reqId,
      message: e instanceof Error ? e.message : String(e),
    }
    self.postMessage(res)
  }
}

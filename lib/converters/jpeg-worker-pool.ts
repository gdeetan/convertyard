// Fixed-size worker pool for JPEG re-encode. Fingerprint → worker index is
// hash-based and deterministic so each worker keeps a warm decode cache for
// its slice of images across ladder rungs.
//
// Falls back to `null` when Worker/OffscreenCanvas are unavailable (SSR,
// happy-dom test env). Callers must handle null and run the main-thread path.
//
// On mobile, pool size is halved and each worker's cache pixel cap is halved
// so a scan-heavy PDF can't push peak RAM past ~500 MB and get the tab killed.
import { isMobile } from '@/lib/utils/is-mobile'

type EncodeRes =
  | { type: 'encoded'; reqId: number; bytes: Uint8Array }
  | { type: 'error'; reqId: number; message: string }

type Pending = {
  resolve: (bytes: Uint8Array) => void
  reject: (err: Error) => void
}

class JpegWorkerPool {
  private workers: Worker[] = []
  private nextReqId = 1
  private pending = new Map<number, Pending>()

  constructor(size: number, cachePixelCap: number) {
    for (let i = 0; i < size; i++) {
      const w = new Worker(new URL('./jpeg.worker.ts', import.meta.url), { type: 'module' })
      w.addEventListener('message', (ev: MessageEvent<EncodeRes>) => {
        const msg = ev.data
        const p = this.pending.get(msg.reqId)
        if (!p) return
        this.pending.delete(msg.reqId)
        if (msg.type === 'encoded') p.resolve(msg.bytes)
        else p.reject(new Error(msg.message))
      })
      w.postMessage({ type: 'init', cachePixelCap })
      this.workers.push(w)
    }
  }

  private pickWorker(fingerprint: string): Worker {
    // FNV-1a over fingerprint → stable index.
    let h = 2166136261 >>> 0
    for (let i = 0; i < fingerprint.length; i++) {
      h ^= fingerprint.charCodeAt(i)
      h = Math.imul(h, 16777619) >>> 0
    }
    return this.workers[h % this.workers.length]
  }

  encode(fingerprint: string, jpegBytes: Uint8Array, quality: number): Promise<Uint8Array> {
    const worker = this.pickWorker(fingerprint)
    const reqId = this.nextReqId++
    return new Promise<Uint8Array>((resolve, reject) => {
      this.pending.set(reqId, { resolve, reject })
      // Copy bytes to a fresh buffer we can transfer without detaching caller's array.
      const copy = new Uint8Array(jpegBytes.byteLength)
      copy.set(jpegBytes)
      worker.postMessage(
        { type: 'encode', reqId, fingerprint, jpegBytes: copy, quality },
        [copy.buffer]
      )
    })
  }

  terminate() {
    for (const w of this.workers) w.terminate()
    this.workers = []
    this.pending.clear()
  }
}

let pool: JpegWorkerPool | null = null
let poolInitTried = false

export function getJpegWorkerPool(): JpegWorkerPool | null {
  if (poolInitTried) return pool
  poolInitTried = true
  try {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null
    const hc = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 2
    const mobile = isMobile()
    // Pool size tuned for MozJPEG encoder: each worker instantiates its own
    // ~8–16 MB WASM heap for @jsquash/jpeg. Desktop caps at 4 so a 16-core
    // machine doesn't spawn 15 workers whose combined WASM heap + decode
    // cache eats hundreds of MB. Mobile stays at 2. Throughput at 4 MozJPEG
    // workers still beats 8 canvas workers because MozJPEG output is ~20%
    // smaller per image — the network handoff never dominates the batch.
    const size = mobile
      ? Math.max(1, Math.min(2, hc))
      : Math.max(2, Math.min(4, hc - 1))
    const cachePixelCap = mobile ? 10_000_000 : 25_000_000
    pool = new JpegWorkerPool(size, cachePixelCap)
    return pool
  } catch {
    pool = null
    return null
  }
}

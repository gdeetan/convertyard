// Fixed-size worker pool for bilevel (CCITT G4) page encode. Round-robin
// dispatch — bilevel encoding is stateless per page (no decode cache to
// keep warm), so equal spread beats fingerprint affinity.
//
// Falls back to `null` when Worker/OffscreenCanvas are unavailable (SSR,
// happy-dom test env). Callers must handle null and run the main-thread path.
import { isMobile } from '@/lib/utils/is-mobile'

type EncodeRes =
  | { type: 'encoded'; reqId: number; ccittBytes: Uint8Array; width: number; height: number }
  | { type: 'error'; reqId: number; message: string }

type Pending = {
  resolve: (out: { ccittBytes: Uint8Array; width: number; height: number }) => void
  reject: (err: Error) => void
}

class BilevelWorkerPool {
  private workers: Worker[] = []
  private nextReqId = 1
  private nextWorker = 0
  private pending = new Map<number, Pending>()

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const w = new Worker(new URL('./pdf-bilevel.worker.ts', import.meta.url), { type: 'module' })
      w.addEventListener('message', (ev: MessageEvent<EncodeRes>) => {
        const msg = ev.data
        const p = this.pending.get(msg.reqId)
        if (!p) return
        this.pending.delete(msg.reqId)
        if (msg.type === 'encoded') p.resolve({ ccittBytes: msg.ccittBytes, width: msg.width, height: msg.height })
        else p.reject(new Error(msg.message))
      })
      this.workers.push(w)
    }
  }

  encode(jpegBytes: Uint8Array): Promise<{ ccittBytes: Uint8Array; width: number; height: number }> {
    // Round-robin: no per-worker state means dispatching to the least-recently-
    // used worker keeps queues even without any hashing overhead.
    const worker = this.workers[this.nextWorker]
    this.nextWorker = (this.nextWorker + 1) % this.workers.length
    const reqId = this.nextReqId++
    return new Promise((resolve, reject) => {
      this.pending.set(reqId, { resolve, reject })
      // Copy bytes to a fresh buffer we can transfer without detaching caller's array.
      const copy = new Uint8Array(jpegBytes.byteLength)
      copy.set(jpegBytes)
      worker.postMessage(
        { type: 'encode', reqId, jpegBytes: copy },
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

let pool: BilevelWorkerPool | null = null
let poolInitTried = false

export function getBilevelWorkerPool(): BilevelWorkerPool | null {
  if (poolInitTried) return pool
  poolInitTried = true
  try {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null
    const hc = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 2
    const mobile = isMobile()
    // Match jpeg pool sizing: desktop caps at 4 so high-core machines don't
    // spawn workers whose combined RAM footprint blows past the tab budget.
    // Mobile stays at 2 to keep peak RAM under ~500 MB on scan-heavy PDFs.
    const size = mobile
      ? Math.max(1, Math.min(2, hc))
      : Math.max(2, Math.min(4, hc - 1))
    pool = new BilevelWorkerPool(size)
    return pool
  } catch {
    pool = null
    return null
  }
}

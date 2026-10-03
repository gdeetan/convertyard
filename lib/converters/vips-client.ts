import type { ToolOptions } from '@/lib/types'
import { readFileBytes } from '@/lib/utils/materialize-file'

// Worker pool so batches encode in parallel across cores. Each wasm-vips
// instance owns its own WASM heap (~50–100 MB), so we cap pool size to
// keep peak memory sane on large batches.
type PoolSlot = { worker: Worker; busy: boolean }

const POOL_SIZE: number = (() => {
  if (typeof navigator === 'undefined') return 1
  const n = navigator.hardwareConcurrency ?? 4
  return Math.max(2, Math.min(4, n - 1))
})()

const pool: PoolSlot[] = []
const waiters: Array<(slot: PoolSlot) => void> = []

function spawnWorker(): Worker {
  return new Worker(new URL('./vips.worker.ts', import.meta.url), { type: 'module' })
}

function acquire(): Promise<PoolSlot> {
  const idle = pool.find((s) => !s.busy)
  if (idle) {
    idle.busy = true
    return Promise.resolve(idle)
  }
  if (pool.length < POOL_SIZE) {
    const slot: PoolSlot = { worker: spawnWorker(), busy: true }
    pool.push(slot)
    return Promise.resolve(slot)
  }
  return new Promise((resolve) => waiters.push(resolve))
}

function release(slot: PoolSlot): void {
  const next = waiters.shift()
  if (next) {
    // Hand the still-busy slot straight to the next waiter — no idle flip.
    next(slot)
  } else {
    slot.busy = false
  }
}

function getMimeType(outputFormat: string): string {
  return outputFormat === 'webp' ? 'image/webp'
    : outputFormat === 'avif' ? 'image/avif'
    : outputFormat === 'png' ? 'image/png'
    : outputFormat === 'tiff' || outputFormat === 'tif' ? 'image/tiff'
    : outputFormat === 'bmp' ? 'image/bmp'
    : 'image/jpeg'
}

export function convertViaWorker(
  file: File,
  outputFormat: string,
  opts: ToolOptions,
  onProgress?: (pct: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const fileName = `${baseName}.${outputFormat}`

    acquire().then((slot) => {
      const { worker } = slot

      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return

        if (e.data.type === 'progress') {
          onProgress?.(e.data.pct)
        } else if (e.data.type === 'result') {
          worker.removeEventListener('message', handler)
          release(slot)
          const result = new File([e.data.data], e.data.fileName, { type: getMimeType(outputFormat) })
          resolve(result)
        } else if (e.data.type === 'error') {
          worker.removeEventListener('message', handler)
          release(slot)
          reject(new Error(e.data.message))
        }
      }

      worker.addEventListener('message', handler)

      readFileBytes(file).then((buffer) => {
        worker.postMessage({ id, fileBuffer: buffer, outputFormat, opts, fileName }, [buffer])
      }).catch((err) => {
        worker.removeEventListener('message', handler)
        release(slot)
        reject(err)
      })
    }).catch(reject)
  })
}

export function extractGifFramesViaWorker(
  file: File,
  opts: ToolOptions,
  onProgress?: (pct: number, totalFrames?: number) => void
): Promise<Array<{ index: number; data: ArrayBuffer }>> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()

    acquire().then((slot) => {
      const { worker } = slot

      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return

        if (e.data.type === 'progress') {
          onProgress?.(e.data.pct)
        } else if (e.data.type === 'meta') {
          onProgress?.(0, e.data.totalFrames)
        } else if (e.data.type === 'frames') {
          worker.removeEventListener('message', handler)
          release(slot)
          resolve(e.data.frames)
        } else if (e.data.type === 'error') {
          worker.removeEventListener('message', handler)
          release(slot)
          reject(new Error(e.data.message))
        }
      }

      worker.addEventListener('message', handler)

      readFileBytes(file).then((buffer) => {
        worker.postMessage({ id, action: 'extract-gif-frames', fileBuffer: buffer, opts }, [buffer])
      }).catch((err) => {
        worker.removeEventListener('message', handler)
        release(slot)
        reject(err)
      })
    }).catch(reject)
  })
}

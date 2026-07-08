/// <reference lib="webworker" />

// Web Worker for image upscaling.
// TF.js WebGL backend runs on GPU via OffscreenCanvas — keeps main thread free
// for large images. Falls back to CPU backend when WebGL is unavailable (Safari <16.4).

import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'
import * as tf from '@tensorflow/tfjs-core'
import Upscaler from 'upscaler'
// @ts-ignore
import x2 from '@upscalerjs/esrgan-slim/2x'
// @ts-ignore
import x3 from '@upscalerjs/esrgan-slim/3x'
// @ts-ignore
import x4 from '@upscalerjs/esrgan-slim/4x'
// @ts-ignore
import x8 from '@upscalerjs/esrgan-slim/8x'

export type UpscaleScale = '2x' | '3x' | '4x' | '8x'

interface LoadMsg  { type: 'load';  scale: UpscaleScale }
interface InferMsg {
  type: 'infer'
  id: string
  scale: UpscaleScale
  buffer: ArrayBuffer
  mimeType: string
  outputFormat?: string
}
type IncomingMsg = LoadMsg | InferMsg

// ── TF.js init ────────────────────────────────────────────────────────────────

let _tfReady = false

async function initTf() {
  if (_tfReady) return
  _tfReady = true
  // TF.js 4.x auto-uses OffscreenCanvas for WebGL context in workers
  const ok = await tf.setBackend('webgl').catch(() => false)
  if (!ok) await tf.setBackend('cpu')
  await tf.ready()
}

// ── Model instances ────────────────────────────────────────────────────────────

const MODEL_MAP = { '2x': x2, '3x': x3, '4x': x4, '8x': x8 } as const
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instances: Partial<Record<UpscaleScale, any>> = {}
const readyMap:  Partial<Record<UpscaleScale, boolean>> = {}

async function loadModel(scale: UpscaleScale) {
  if (readyMap[scale]) return
  await initTf()
  instances[scale] = new Upscaler({ model: MODEL_MAP[scale] })
  self.postMessage({ type: 'model-progress', scale, progress: 50 })
  await instances[scale].warmup([{ patchSize: 64, padding: 2 }])
  readyMap[scale] = true
  self.postMessage({ type: 'model-ready', scale })
}

// ── Inference ──────────────────────────────────────────────────────────────────

const SAFE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SCALE_NUM: Record<UpscaleScale, number> = { '2x': 2, '3x': 3, '4x': 4, '8x': 8 }
// Tiles are processed one at a time. 256px input → max 2048px output tile at 8×,
// keeping peak tensor memory ~50 MB regardless of source image size.
const TILE_PX = 256

async function runInference(
  id: string,
  scale: UpscaleScale,
  buffer: ArrayBuffer,
  mimeType: string,
  outputFormat?: string
) {
  const upscaler = instances[scale]
  if (!upscaler) throw new Error(`Model ${scale} not loaded`)

  const rawMime = outputFormat ?? mimeType
  const outMime = SAFE_MIMES.has(rawMime) ? rawMime : 'image/png'
  const scaleFactor = SCALE_NUM[scale]

  // Decode source image
  const blob   = new Blob([buffer], { type: mimeType })
  const bitmap = await createImageBitmap(blob)
  const srcW = bitmap.width
  const srcH = bitmap.height

  // Allocate full output canvas at upscaled dimensions
  const out    = new OffscreenCanvas(srcW * scaleFactor, srcH * scaleFactor)
  const outCtx = out.getContext('2d')!

  // Build tile grid
  const xStarts = buildStarts(srcW, TILE_PX)
  const yStarts = buildStarts(srcH, TILE_PX)
  const total   = xStarts.length * yStarts.length
  let done = 0

  self.postMessage({ type: 'infer-progress', id, progress: 10 })

  for (const sy of yStarts) {
    for (const sx of xStarts) {
      const tw = Math.min(TILE_PX, srcW - sx)
      const th = Math.min(TILE_PX, srcH - sy)

      // Extract tile as ImageData
      const tileCanvas = new OffscreenCanvas(tw, th)
      tileCanvas.getContext('2d')!.drawImage(bitmap, sx, sy, tw, th, 0, 0, tw, th)
      const tileData = tileCanvas.getContext('2d')!.getImageData(0, 0, tw, th)

      // Upscale tile — no patchSize; tile is already small enough for GPU
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tensor: any = await upscaler.upscale(tileData, { output: 'tensor' })

      // Render tensor to a small OffscreenCanvas, draw onto output, dispose immediately
      const tileOut = new OffscreenCanvas(tensor.shape[1], tensor.shape[0])
      await tf.browser.toPixels(tensor, tileOut as unknown as HTMLCanvasElement)
      tensor.dispose()

      outCtx.drawImage(tileOut as unknown as CanvasImageSource, sx * scaleFactor, sy * scaleFactor)

      done++
      self.postMessage({ type: 'infer-progress', id, progress: 10 + Math.round((done / total) * 80) })
    }
  }

  bitmap.close()

  self.postMessage({ type: 'infer-progress', id, progress: 95 })

  const resultBlob   = await out.convertToBlob({ type: outMime, quality: 0.92 })
  const resultBuffer = await resultBlob.arrayBuffer()

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage(
    { type: 'infer-result', id, result: resultBuffer, outputMime: outMime },
    [resultBuffer]
  )
}

function buildStarts(dim: number, tileSize: number): number[] {
  const starts: number[] = []
  for (let pos = 0; pos < dim; pos += tileSize) starts.push(pos)
  return starts
}

// ── Message router ─────────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      await loadModel(msg.scale)
    } catch (err) {
      self.postMessage({ type: 'error', message: (err as Error).message })
    }
    return
  }

  if (msg.type === 'infer') {
    try {
      await runInference(msg.id, msg.scale, msg.buffer, msg.mimeType, msg.outputFormat)
    } catch (err) {
      self.postMessage({ type: 'error', id: msg.id, message: (err as Error).message })
    }
  }
})

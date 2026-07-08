/// <reference lib="webworker" />

// Web Worker for image upscaling.
// TF.js backend priority: WebGPU (Chrome 113+, 2-3× faster) → WebGL → CPU.
// OffscreenCanvas used for GPU context in workers.

import '@tensorflow/tfjs-backend-webgpu'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'
import * as tf from '@tensorflow/tfjs-core'
import Upscaler from 'upscaler'
import { detectFlatOutputMismatch, normalizeTensorShape, rgbaFromTensorFloats } from './upscaler-render'
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
type UpscalerBackend = 'webgpu' | 'webgl' | 'cpu'
let activeBackend: UpscalerBackend | null = null

async function initTf() {
  if (_tfReady) return
  await ensureBackend(['webgpu', 'webgl', 'cpu'])
  _tfReady = true
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
// Overlap on each side of a tile so the model has context across boundaries.
// Only the inner region is blitted to the output — eliminates seam artifacts.
const OVERLAP = 8

async function ensureBackend(order: UpscalerBackend[]): Promise<UpscalerBackend> {
  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator

  for (const backend of order) {
    if (backend === 'webgpu' && !hasWebGPU) continue
    if (activeBackend === backend && tf.getBackend() === backend) {
      await tf.ready()
      return backend
    }
    const ok = await tf.setBackend(backend).catch(() => false)
    if (!ok) continue
    await tf.ready()
    if (activeBackend !== backend) resetUpscalerInstances()
    activeBackend = backend
    return backend
  }

  throw new Error(`Unable to initialize any TF backend (${order.join(' -> ')})`)
}

function resetUpscalerInstances() {
  for (const scale of Object.keys(instances) as UpscaleScale[]) {
    const instance = instances[scale]
    if (instance && typeof instance.dispose === 'function') {
      try {
        instance.dispose()
      } catch {
        // Ignore disposal failures during backend switches.
      }
    }
    delete instances[scale]
    delete readyMap[scale]
  }
}

function fallbackOrderFor(backend: UpscalerBackend | null): UpscalerBackend[] {
  switch (backend) {
    case 'webgpu':
      return ['webgl', 'cpu']
    case 'webgl':
      return ['cpu']
    default:
      return []
  }
}

async function upscaleTileToRgba(scale: UpscaleScale, tileData: ImageData) {
  const upscaler = instances[scale]
  if (!upscaler) throw new Error(`Model ${scale} not loaded`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tensor: any = await upscaler.upscale(tileData, { output: 'tensor' })
  const shape = Array.from(tensor.shape as number[])
  const { width, height } = normalizeTensorShape(shape)
  const clipped = tensor.clipByValue(0, 1)
  tensor.dispose()
  const floats = await clipped.data() as Float32Array
  clipped.dispose()
  const rgba = rgbaFromTensorFloats(floats, shape)
  return { width, height, rgba }
}

async function runInference(
  id: string,
  scale: UpscaleScale,
  buffer: ArrayBuffer,
  mimeType: string,
  outputFormat?: string
) {
  if (!instances[scale]) throw new Error(`Model ${scale} not loaded`)

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

      // Overlap padding — skip at image edges to avoid out-of-bounds reads
      const padL = sx > 0 ? OVERLAP : 0
      const padT = sy > 0 ? OVERLAP : 0
      const padR = sx + tw < srcW ? OVERLAP : 0
      const padB = sy + th < srcH ? OVERLAP : 0

      const extX = sx - padL
      const extY = sy - padT
      const extW = tw + padL + padR
      const extH = th + padT + padB

      // Extract overlapping tile as ImageData
      const tileCanvas = new OffscreenCanvas(extW, extH)
      tileCanvas.getContext('2d')!.drawImage(bitmap, extX, extY, extW, extH, 0, 0, extW, extH)
      const tileData = tileCanvas.getContext('2d')!.getImageData(0, 0, extW, extH)

      let rendered = await upscaleTileToRgba(scale, tileData)
      if (detectFlatOutputMismatch(tileData.data, rendered.rgba)) {
        let recovered = false
        for (const backend of fallbackOrderFor(activeBackend)) {
          self.postMessage({
            type: 'log',
            id,
            message: `Upscaler tile fallback: ${activeBackend ?? 'unknown'} -> ${backend}`,
          })
          await ensureBackend([backend])
          await loadModel(scale)
          rendered = await upscaleTileToRgba(scale, tileData)
          if (!detectFlatOutputMismatch(tileData.data, rendered.rgba)) {
            recovered = true
            break
          }
        }
        if (!recovered) {
          throw new Error(`Upscaler produced flat output on ${activeBackend ?? 'unknown'} backend`)
        }
      }

      const tileOut = new OffscreenCanvas(rendered.width, rendered.height)
      tileOut.getContext('2d')!.putImageData(
        new ImageData(new Uint8ClampedArray(rendered.rgba), rendered.width, rendered.height),
        0,
        0
      )

      // Blit only the inner (non-overlap) region — seams eliminated
      outCtx.drawImage(
        tileOut as unknown as CanvasImageSource,
        padL * scaleFactor, padT * scaleFactor,
        tw * scaleFactor, th * scaleFactor,
        sx * scaleFactor, sy * scaleFactor,
        tw * scaleFactor, th * scaleFactor
      )

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

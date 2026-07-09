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
import x2 from '@upscalerjs/esrgan-medium/2x'
// @ts-ignore
import x3 from '@upscalerjs/esrgan-medium/3x'
// @ts-ignore
import x4 from '@upscalerjs/esrgan-medium/4x'
// @ts-ignore
import x8 from '@upscalerjs/esrgan-medium/8x'

export type UpscaleScale = '2x' | '3x' | '4x' | '8x'
export type ImageMode = 'auto' | 'photo' | 'graphic'

interface LoadMsg  { type: 'load';  scale: UpscaleScale }
interface InferMsg {
  type: 'infer'
  id: string
  scale: UpscaleScale
  buffer: ArrayBuffer
  mimeType: string
  outputFormat?: string
  imageMode?: ImageMode
}
type IncomingMsg = LoadMsg | InferMsg

// ── TF.js init ────────────────────────────────────────────────────────────────

let _tfReady = false
type UpscalerBackend = 'webgpu' | 'webgl' | 'cpu'
let activeBackend: UpscalerBackend | null = null

async function initTf() {
  if (_tfReady) return
  // WebGPU produces incorrect tensor output for ESRGAN (values compressed into ~0.05 range).
  // WebGL is fast and correct; CPU is the safe fallback.
  await ensureBackend(['webgl', 'cpu'])
  _tfReady = true
}

// ── Model instances ────────────────────────────────────────────────────────────

const MODEL_MAP = { '2x': x2, '3x': x3, '4x': x4, '8x': x8 } as const
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instances: Partial<Record<UpscaleScale, any>> = {}
const readyMap:  Partial<Record<UpscaleScale, boolean>> = {}

async function loadModel(scale: UpscaleScale) {
  if (readyMap[scale]) return
  // 8x ESRGAN output tensors exceed the WebGL GPU texture limit (16384px) regardless
  // of tile size. CPU backend has no such constraint; slower but always correct.
  if (scale === '8x') {
    await ensureBackend(['cpu'])
  } else {
    await initTf()
  }
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
  const floats = await tensor.data() as Float32Array
  tensor.dispose()
  const rgba = rgbaFromTensorFloats(floats, shape)
  return { width, height, rgba }
}

// Detect whether an image is photorealistic or a graphic (illustration, infographic, etc.)
// Uses two independent signals and classifies as graphic if either fires:
//
//   Signal 1 — unique colour ratio (5-bit quantised):
//     Photos  → 0.20–0.80  (organic gradients everywhere)
//     Graphics → 0.001–0.10 (few distinct hues, even with illustrations)
//
//   Signal 2 — flat patch ratio (8×8 luma-variance blocks):
//     Photos  → <5% of patches are flat (noise in every region)
//     Graphics → >30% of patches are flat (large solid-colour fills)
//
// Using OR means a complex illustrated infographic (many colours BUT lots of
// flat regions) is still caught by signal 2 even when signal 1 misses it.
function detectImageMode(bitmap: ImageBitmap): 'photo' | 'graphic' {
  const SAMPLE = 200
  const canvas = new OffscreenCanvas(SAMPLE, SAMPLE)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, SAMPLE, SAMPLE)
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE)

  // Signal 1: unique colour count
  const colors = new Set<number>()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]     >> 3
    const g = data[i + 1] >> 3
    const b = data[i + 2] >> 3
    colors.add((r << 10) | (g << 5) | b)
  }
  const uniqueRatio = colors.size / (SAMPLE * SAMPLE)

  // Signal 2: flat patch ratio (8×8 blocks with near-zero luma variance)
  const PATCH = 8
  let flatPatches = 0, totalPatches = 0
  for (let py = 0; py <= SAMPLE - PATCH; py += PATCH) {
    for (let px = 0; px <= SAMPLE - PATCH; px += PATCH) {
      let sum = 0, sumSq = 0, n = 0
      for (let dy = 0; dy < PATCH; dy++) {
        for (let dx = 0; dx < PATCH; dx++) {
          const idx = ((py + dy) * SAMPLE + (px + dx)) * 4
          const luma = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
          sum += luma; sumSq += luma * luma; n++
        }
      }
      const mean = sum / n
      if (sumSq / n - mean * mean < 50) flatPatches++
      totalPatches++
    }
  }
  const flatRatio = flatPatches / totalPatches

  return (uniqueRatio < 0.15 || flatRatio > 0.30) ? 'graphic' : 'photo'
}

// Step-up canvas scaling for graphics: upscale in 2× passes rather than one
// large pass. Each pass uses a narrower bicubic kernel → sharper result.
// 2× → 1 pass. 3× → 2× then 1.5×. 4× → 2× twice. 8× → 2× three times.
function graphicScale(src: ImageBitmap | OffscreenCanvas, targetW: number, targetH: number): OffscreenCanvas {
  let cur: ImageBitmap | OffscreenCanvas = src
  let curW = src instanceof ImageBitmap ? src.width  : src.width
  let curH = src instanceof ImageBitmap ? src.height : src.height

  while (curW < targetW || curH < targetH) {
    const nextW = Math.min(curW * 2, targetW)
    const nextH = Math.min(curH * 2, targetH)
    const step  = new OffscreenCanvas(nextW, nextH)
    const sCtx  = step.getContext('2d')!
    sCtx.imageSmoothingEnabled = true
    sCtx.imageSmoothingQuality = 'high'
    sCtx.drawImage(cur as CanvasImageSource, 0, 0, nextW, nextH)
    cur = step; curW = nextW; curH = nextH
  }

  return cur as OffscreenCanvas
}

async function runInference(
  id: string,
  scale: UpscaleScale,
  buffer: ArrayBuffer,
  mimeType: string,
  outputFormat?: string,
  imageMode: ImageMode = 'auto'
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

  // Chrome GPU-backed canvases silently fail above ~16384px per side.
  // If the scaled output would exceed MAX_CANVAS_DIM, downscale the source first
  // so the output canvas stays within GPU limits.
  const MAX_CANVAS_DIM = 8192
  let workBitmap: ImageBitmap = bitmap
  let workW = srcW
  let workH = srcH
  if (srcW * scaleFactor > MAX_CANVAS_DIM || srcH * scaleFactor > MAX_CANVAS_DIM) {
    const limitRatio = Math.min(MAX_CANVAS_DIM / (srcW * scaleFactor), MAX_CANVAS_DIM / (srcH * scaleFactor))
    workW = Math.round(srcW * limitRatio)
    workH = Math.round(srcH * limitRatio)
    const scaleCanvas = new OffscreenCanvas(workW, workH)
    scaleCanvas.getContext('2d')!.drawImage(bitmap, 0, 0, workW, workH)
    workBitmap = await createImageBitmap(scaleCanvas)
    self.postMessage({
      type: 'log',
      id,
      message: `Source scaled ${srcW}×${srcH} → ${workW}×${workH} to fit GPU canvas limit (output would have been ${srcW * scaleFactor}×${srcH * scaleFactor})`,
    })
  }

  // Resolve auto-detection
  const resolvedMode = imageMode === 'auto' ? detectImageMode(workBitmap) : imageMode
  self.postMessage({ type: 'log', id, message: `Image mode: ${resolvedMode}${imageMode === 'auto' ? ' (auto-detected)' : ''}` })

  // ── Graphic path: step-up canvas scaling ───────────────────────────────────
  // Upscales in 2× passes so each bicubic kernel operates over fewer pixels
  // → sharper than a single large-factor pass. Flat colours and hard edges
  // are preserved; no AI texture hallucination.
  if (resolvedMode === 'graphic') {
    const out = graphicScale(workBitmap, workW * scaleFactor, workH * scaleFactor)
    bitmap.close()
    if (workBitmap !== bitmap) workBitmap.close()
    self.postMessage({ type: 'infer-progress', id, progress: 90 })
    const resultBlob   = await out.convertToBlob({ type: outMime, quality: 0.92 })
    const resultBuffer = await resultBlob.arrayBuffer()
    self.postMessage({ type: 'infer-progress', id, progress: 100 })
    self.postMessage({ type: 'infer-result', id, result: resultBuffer, outputMime: outMime }, [resultBuffer])
    return
  }

  // ── Photo path: ESRGAN tiling ──────────────────────────────────────────────

  // Allocate full output canvas at upscaled dimensions
  const out    = new OffscreenCanvas(workW * scaleFactor, workH * scaleFactor)
  const outCtx = out.getContext('2d')!

  // Build tile grid
  const xStarts = buildStarts(workW, TILE_PX)
  const yStarts = buildStarts(workH, TILE_PX)
  const total   = xStarts.length * yStarts.length
  let done = 0

  self.postMessage({ type: 'infer-progress', id, progress: 10 })

  for (const sy of yStarts) {
    for (const sx of xStarts) {
      const tw = Math.min(TILE_PX, workW - sx)
      const th = Math.min(TILE_PX, workH - sy)

      // Overlap padding — skip at image edges to avoid out-of-bounds reads
      const padL = sx > 0 ? OVERLAP : 0
      const padT = sy > 0 ? OVERLAP : 0
      const padR = sx + tw < workW ? OVERLAP : 0
      const padB = sy + th < workH ? OVERLAP : 0

      const extX = sx - padL
      const extY = sy - padT
      const extW = tw + padL + padR
      const extH = th + padT + padB

      // Extract overlapping tile as ImageData
      const tileCanvas = new OffscreenCanvas(extW, extH)
      tileCanvas.getContext('2d')!.drawImage(workBitmap, extX, extY, extW, extH, 0, 0, extW, extH)
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
  if (workBitmap !== bitmap) workBitmap.close()

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
      await runInference(msg.id, msg.scale, msg.buffer, msg.mimeType, msg.outputFormat, msg.imageMode)
    } catch (err) {
      self.postMessage({ type: 'error', id: msg.id, message: (err as Error).message })
    }
  }
})

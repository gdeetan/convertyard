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

// Generalized Lanczos2 weight with explicit support radius.
// For upscaling: radius = 2 (source-pixel units).
// For downscaling: radius = 2 / scale — widens the kernel to prevent aliasing.
function lanczosWeight(x: number, radius: number): number {
  const ax = Math.abs(x)
  if (ax === 0) return 1
  if (ax >= radius) return 0
  const norm = ax / radius       // normalise to [0, 1) regardless of radius
  const pnorm = Math.PI * norm
  return (Math.sin(pnorm) / pnorm) * (Math.sin(pnorm * 0.5) / (pnorm * 0.5))
}

// Strip-based separable Lanczos2 for graphics (handles both upscale and downscale).
//
// Two-pass (H then V) to keep complexity O(N·k) instead of O(N·k²).
// Processes vertical strips of STRIP_H output rows at a time so peak RAM stays
// bounded — ~6 MB per strip even for a 12848×7594 source, regardless of scale factor.
//
// This function accepts the original undegraded bitmap; callers must NOT pre-downscale
// before calling (use capW/capH to stay within GPU limits instead).
async function graphicScale(
  bitmap: ImageBitmap,
  targetW: number,
  targetH: number,
  onProgress: (pct: number) => void
): Promise<OffscreenCanvas> {
  const srcW = bitmap.width
  const srcH = bitmap.height
  const scaleX = targetW / srcW
  const scaleY = targetH / srcH
  // Widen kernel support for downscaling so we anti-alias instead of aliasing.
  const radiusX = Math.max(2, 2 / scaleX)
  const radiusY = Math.max(2, 2 / scaleY)

  // Pre-compute H-pass kernel per output column (reused for every row strip).
  const hStart = new Int32Array(targetW)
  const hWts: Float32Array[] = []
  for (let tx = 0; tx < targetW; tx++) {
    const sx = (tx + 0.5) / scaleX - 0.5
    const x0 = Math.max(0, Math.ceil(sx - radiusX))
    const x1 = Math.min(srcW - 1, Math.floor(sx + radiusX))
    const ws = new Float32Array(x1 - x0 + 1)
    let wsum = 0
    for (let xi = x0; xi <= x1; xi++) { ws[xi - x0] = lanczosWeight(xi - sx, radiusX); wsum += ws[xi - x0] }
    if (wsum > 0) for (let i = 0; i < ws.length; i++) ws[i] /= wsum
    hStart[tx] = x0
    hWts.push(ws)
  }

  const STRIP_H = 64  // output rows per strip
  const out    = new OffscreenCanvas(targetW, targetH)
  const outCtx = out.getContext('2d')!

  for (let ty0 = 0; ty0 < targetH; ty0 += STRIP_H) {
    const ty1      = Math.min(targetH, ty0 + STRIP_H)
    const nOutRows = ty1 - ty0

    // Source rows required for this output strip (V-kernel margin on both sides).
    const sy0f = (ty0 + 0.5) / scaleY - 0.5
    const sy1f = (ty1 - 0.5) / scaleY - 0.5
    const sy0  = Math.max(0, Math.floor(sy0f - radiusY))
    const sy1  = Math.min(srcH - 1, Math.ceil(sy1f + radiusY))
    const nSrcRows = sy1 - sy0 + 1

    // Extract only the needed source rows (cheap canvas crop — no full-image read).
    const srcStrip = new OffscreenCanvas(srcW, nSrcRows)
    srcStrip.getContext('2d')!.drawImage(bitmap, 0, sy0, srcW, nSrcRows, 0, 0, srcW, nSrcRows)
    const srcData = srcStrip.getContext('2d')!.getImageData(0, 0, srcW, nSrcRows).data

    // ── H-pass: srcW × nSrcRows → targetW × nSrcRows ────────────────────
    // Float32 avoids precision loss from clamping between passes.
    const inter = new Float32Array(targetW * nSrcRows * 4)
    for (let ry = 0; ry < nSrcRows; ry++) {
      const srcOff = ry * srcW    * 4
      const iOff   = ry * targetW * 4
      for (let tx = 0; tx < targetW; tx++) {
        const s0 = hStart[tx]; const ws = hWts[tx]
        let r = 0, g = 0, b = 0, a = 0
        for (let k = 0; k < ws.length; k++) {
          const si = srcOff + (s0 + k) * 4; const w = ws[k]
          r += srcData[si] * w; g += srcData[si + 1] * w; b += srcData[si + 2] * w; a += srcData[si + 3] * w
        }
        const oi = iOff + tx * 4
        inter[oi] = r; inter[oi + 1] = g; inter[oi + 2] = b; inter[oi + 3] = a
      }
    }

    // ── V-pass: targetW × nSrcRows → targetW × nOutRows ─────────────────
    const outImg = new ImageData(targetW, nOutRows)
    const outPx  = outImg.data
    for (let ty = ty0; ty < ty1; ty++) {
      const sy  = (ty + 0.5) / scaleY - 0.5
      const y0  = Math.max(sy0, Math.ceil (sy - radiusY))
      const y1  = Math.min(sy1, Math.floor(sy + radiusY))
      const vws: number[] = []; let vsum = 0
      for (let yi = y0; yi <= y1; yi++) { const w = lanczosWeight(yi - sy, radiusY); vws.push(w); vsum += w }
      const oRow = (ty - ty0) * targetW * 4
      for (let tx = 0; tx < targetW; tx++) {
        let r = 0, g = 0, b = 0, a = 0
        for (let k = 0; k < vws.length; k++) {
          const ii = (y0 - sy0 + k) * targetW * 4 + tx * 4; const w = vws[k] / vsum
          r += inter[ii] * w; g += inter[ii + 1] * w; b += inter[ii + 2] * w; a += inter[ii + 3] * w
        }
        const oi = oRow + tx * 4
        outPx[oi]     = Math.max(0, Math.min(255, r))
        outPx[oi + 1] = Math.max(0, Math.min(255, g))
        outPx[oi + 2] = Math.max(0, Math.min(255, b))
        outPx[oi + 3] = Math.max(0, Math.min(255, a))
      }
    }

    outCtx.putImageData(outImg, 0, ty0)
    onProgress(Math.round((ty1 / targetH) * 90))
    await new Promise<void>(r => setTimeout(r, 0))  // yield between strips
  }

  return out
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

  // Chrome GPU-backed canvases (WebGL/ESRGAN) silently fail above ~16384px per side.
  // 2D-only canvases (Lanczos graphic path) support up to ~32768px — use a higher cap
  // so large source images still produce output bigger than the original.
  const MAX_CANVAS_DIM = 8192   // ESRGAN/WebGL photo path
  const MAX_GRAPHIC_DIM = 16384 // Lanczos 2D canvas graphic path
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

  // ── Graphic path: Lanczos2 separable upscale ───────────────────────────────
  // Pass the original undegraded bitmap so Lanczos operates on full-resolution
  // source pixels. The canvas guard pre-downscale (bicubic) would destroy quality
  // before Lanczos could run — here we cap the OUTPUT instead and let Lanczos
  // handle any scale ratio (including downscale) correctly via its widened kernel.
  if (resolvedMode === 'graphic') {
    const rawOutW = srcW * scaleFactor
    const rawOutH = srcH * scaleFactor
    // Use the higher 2D canvas cap so output is never smaller than the source.
    const capRatio = Math.min(1, MAX_GRAPHIC_DIM / rawOutW, MAX_GRAPHIC_DIM / rawOutH)
    const capW = Math.round(rawOutW * capRatio)
    const capH = Math.round(rawOutH * capRatio)
    if (capRatio < 1) {
      self.postMessage({ type: 'log', id, message: `Graphic: capping output ${rawOutW}×${rawOutH} → ${capW}×${capH} (canvas limit)` })
    }
    const out = await graphicScale(
      bitmap,   // original — Lanczos handles the full ratio directly
      capW,
      capH,
      (pct) => self.postMessage({ type: 'infer-progress', id, progress: pct })
    )
    bitmap.close()
    if (workBitmap !== bitmap) workBitmap.close()
    self.postMessage({ type: 'infer-progress', id, progress: 95 })
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

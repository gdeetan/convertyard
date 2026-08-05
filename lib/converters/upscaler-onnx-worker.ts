/// <reference lib="webworker" />

// Web Worker for image upscaling via Swin2SR (ONNX Runtime Web / @huggingface/transformers).
// Backend priority: WebGPU → WebGL → WASM.
// Blank-image detection triggers automatic backend downgrade per tile.

import { GaussianAccumulator, detectFlatOutputMismatch } from './upscaler-render'

declare const __HF_TOKEN__: string

export type UpscaleScale = '2x' | '3x' | '4x' | '8x'
export type ImageMode = 'auto' | 'photo' | 'photo-compressed' | 'graphic'

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

// ── HuggingFace Auth ───────────────────────────────────────────────────────────

let _authReady = false
async function ensureHfAuth() {
  if (_authReady) return
  _authReady = true
  if (!__HF_TOKEN__) return
  const { env } = await import('@huggingface/transformers')
  const _fetch = env.fetch
  env.fetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const u = url instanceof Request ? url.url : url instanceof URL ? url.href : String(url)
    if (u.includes('huggingface.co') || u.includes('hf.co')) {
      const headers = new Headers((init?.headers ?? {}) as HeadersInit)
      headers.set('Authorization', `Bearer ${__HF_TOKEN__}`)
      return _fetch(u as unknown as string, { ...init, headers })
    }
    return _fetch(url as unknown as string, init)
  }
}

// ── Device management ──────────────────────────────────────────────────────────

type OnnxDevice = 'webgpu' | 'wasm' | 'cpu'
let activeDevice: OnnxDevice = 'webgpu'

// Cache: modelId → pipeline Promise (Promise cached to prevent TOCTOU duplicate creation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pipelineCache = new Map<string, Promise<any>>()

async function clearPipelineCache() {
  for (const [, pipePromise] of pipelineCache) {
    try {
      const pipe = await pipePromise
      if (pipe && typeof pipe.dispose === 'function') {
        try { pipe.dispose() } catch { /* ignore */ }
      }
    } catch { /* ignore rejected promises */ }
  }
  pipelineCache.clear()
}

// ── Model routing ──────────────────────────────────────────────────────────────

type PhotoMode = 'photo' | 'photo-compressed'

interface ModelChain {
  modelId: string
  scale: number
}

interface ModelRouting {
  chains: ModelChain[]
  actualScale: number
}

function modelRouting(scale: UpscaleScale, mode: PhotoMode): ModelRouting {
  const CLASSICAL_X2 = 'Xenova/swin2SR-classical-sr-x2-64'
  const COMPRESSED_X2 = 'Xenova/swin2SR-compressed-sr-x2-48'
  const REALWORLD_X4 = 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr'

  const x2Model = mode === 'photo-compressed' ? COMPRESSED_X2 : CLASSICAL_X2

  switch (scale) {
    case '2x':
      return {
        chains: [{ modelId: x2Model, scale: 2 }],
        actualScale: 2,
      }
    case '3x':
      // Run x4 model, then bicubic 0.75× downsample to get 3×
      return {
        chains: [{ modelId: REALWORLD_X4, scale: 4 }],
        actualScale: 4, // will be downsampled to 3× after
      }
    case '4x':
      return {
        chains: [{ modelId: REALWORLD_X4, scale: 4 }],
        actualScale: 4,
      }
    case '8x':
      // Chain: x4 realworld → x2 classical
      return {
        chains: [
          { modelId: REALWORLD_X4, scale: 4 },
          { modelId: x2Model, scale: 2 },
        ],
        actualScale: 8,
      }
  }
}

// ── Pipeline loader ────────────────────────────────────────────────────────────

async function getPipeline(modelId: string, scale: UpscaleScale, device: OnnxDevice) {
  const cacheKey = `${modelId}::${device}`
  if (pipelineCache.has(cacheKey)) return pipelineCache.get(cacheKey)!

  await ensureHfAuth()
  const { pipeline } = await import('@huggingface/transformers')

  // Cache the Promise immediately to prevent TOCTOU: concurrent callers get the same Promise
  const p = pipeline('image-to-image', modelId, {
    device,
    dtype: 'q8',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress_callback: (info: any) => {
      const pct = typeof info?.progress === 'number' ? Math.round(info.progress) : 0
      self.postMessage({ type: 'model-progress', scale, progress: pct })
    },
  })

  pipelineCache.set(cacheKey, p)
  return p
}

// ── Model load (warm-up) ───────────────────────────────────────────────────────

const readyModels = new Set<string>()
// Shared promise per scale — prevents concurrent loadModel calls and lets
// runInference await the same in-flight load rather than re-entering loadModel.
const modelLoadingMap = new Map<UpscaleScale, Promise<void>>()

function ensureModel(scale: UpscaleScale): Promise<void> {
  if (readyModels.has(scale)) return Promise.resolve()
  if (modelLoadingMap.has(scale)) return modelLoadingMap.get(scale)!
  const p = loadModel(scale)
  modelLoadingMap.set(scale, p)
  p.finally(() => modelLoadingMap.delete(scale))
  return p
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms on ${label}`)), ms)
    ),
  ])
}

async function loadModel(scale: UpscaleScale) {
  if (readyModels.has(scale)) return

  // For 2x we need BOTH classical and compressed variants because the correct one is
  // chosen at inference time based on detected image content. Loading both here prevents
  // a silent mid-inference download that stalls the progress bar at 10%.
  const routings =
    scale === '2x'
      ? [modelRouting('2x', 'photo'), modelRouting('2x', 'photo-compressed')]
      : [modelRouting(scale, 'photo')]

  // Deduplicate model IDs (e.g. 4x and 3x both use REALWORLD_X4)
  const allChains = routings.flatMap((r) => r.chains)
  const uniqueChains = allChains.filter(
    (c, i) => allChains.findIndex((x) => x.modelId === c.modelId) === i
  )

  const deviceOrder: OnnxDevice[] = ['webgpu', 'wasm', 'cpu']
  // WebGPU negotiation can hang indefinitely on unsupported browsers — cap it at 15s
  const DEVICE_TIMEOUT_MS: Record<OnnxDevice, number> = { webgpu: 15_000, wasm: 60_000, cpu: 120_000 }

  // Try each device in order until one succeeds. GPU may fail or stall on unsupported
  // browsers — fall through to WASM silently.
  for (const device of deviceOrder) {
    try {
      for (const chain of uniqueChains) {
        const cacheKey = `${chain.modelId}::${device}`
        if (!pipelineCache.has(cacheKey)) {
          await withTimeout(
            getPipeline(chain.modelId, scale, device),
            DEVICE_TIMEOUT_MS[device],
            device
          )
        }
      }
      activeDevice = device
      break
    } catch {
      // Remove the stalled/rejected promise so the next device can cache its own
      for (const chain of uniqueChains) {
        pipelineCache.delete(`${chain.modelId}::${device}`)
      }
      if (device === 'cpu') throw new Error('Failed to initialize upscaler on any ONNX device')
    }
  }

  readyModels.add(scale)
  self.postMessage({ type: 'model-ready', scale })
  self.postMessage({ type: 'log', message: `ONNX upscaler ready on ${activeDevice}` })
}

// ── RawImage → RGBA Uint8ClampedArray ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawImageToRgba(rawImg: any): { rgba: Uint8ClampedArray; width: number; height: number } {
  if (rawImg.channels !== 3) throw new Error(`Expected 3-channel RGB output from model, got ${rawImg.channels} channels`)
  const { data, width, height } = rawImg
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4]     = data[i * 3]
    rgba[i * 4 + 1] = data[i * 3 + 1]
    rgba[i * 4 + 2] = data[i * 3 + 2]
    rgba[i * 4 + 3] = 255
  }
  return { rgba, width, height }
}

// ── Tile inference with blank-image retry ──────────────────────────────────────

async function inferTile(
  modelId: string,
  scale: UpscaleScale,
  extW: number,
  extH: number,
  rgbData: Uint8Array,
  tileRgba: Uint8ClampedArray, // source tile RGBA for mismatch check
  id: string
): Promise<{ rgba: Uint8ClampedArray; width: number; height: number }> {
  const { RawImage } = await import('@huggingface/transformers')

  const deviceOrder: OnnxDevice[] = ['webgpu', 'wasm', 'cpu']
  let deviceIdx = deviceOrder.indexOf(activeDevice)

  while (deviceIdx < deviceOrder.length) {
    const device = deviceOrder[deviceIdx]
    const pipe = await getPipeline(modelId, scale, device)
    const rawImg = new RawImage(rgbData, extW, extH, 3)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await pipe(rawImg)
    const { rgba, width, height } = rawImageToRgba(result)

    // Shape validated at caller level using chain.scale
    if (!detectFlatOutputMismatch(tileRgba, rgba)) {
      // Good output — if we switched device, update activeDevice
      if (device !== activeDevice) {
        self.postMessage({ type: 'log', id, message: `ONNX backend switched to ${device}` })
        activeDevice = device
      }
      return { rgba, width, height }
    }

    // Blank output detected
    if (deviceIdx + 1 >= deviceOrder.length) {
      throw new Error(`Upscaler produced flat output on all ONNX backends`)
    }

    const nextDevice = deviceOrder[deviceIdx + 1]
    self.postMessage({
      type: 'log',
      id,
      message: `Blank tile on ${device}, retrying with ${nextDevice}`,
    })

    // Dispose cached pipeline for this model+device and switch
    const cacheKey = `${modelId}::${device}`
    const oldPipePromise = pipelineCache.get(cacheKey)
    if (oldPipePromise) {
      try {
        const oldPipe = await oldPipePromise
        if (oldPipe && typeof oldPipe.dispose === 'function') {
          try { oldPipe.dispose() } catch { /* ignore */ }
        }
      } catch { /* ignore rejected promise */ }
    }
    pipelineCache.delete(cacheKey)

    // Switch active device and clear all pipelines (different device needs fresh init)
    await clearPipelineCache()
    activeDevice = nextDevice
    deviceIdx++
  }

  throw new Error('Exhausted all ONNX backends')
}

// ── Image mode detection ───────────────────────────────────────────────────────

// Signal 1 — unique colour ratio (5-bit quantised)
// Signal 2 — flat patch ratio (8×8 luma-variance blocks)
// Signal 3 — DCT block boundary energy (JPEG artifact detection → photo-compressed)
function detectImageMode(bitmap: ImageBitmap): 'photo' | 'photo-compressed' | 'graphic' {
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

  // Signal 1 or 2 → graphic
  if (uniqueRatio < 0.15 || flatRatio > 0.30) return 'graphic'

  // Signal 3: DCT block boundary energy (8px-interval gradients)
  // Sample mean absolute gradient at 8px x-intervals and 8px y-intervals
  // vs non-boundary pixels in a 200×200 sample.
  const BLOCK = 8
  let boundaryGrad = 0, boundaryCount = 0
  let nonBoundaryGrad = 0, nonBoundaryCount = 0

  for (let y = 1; y < SAMPLE - 1; y++) {
    for (let x = 1; x < SAMPLE - 1; x++) {
      const idx = (y * SAMPLE + x) * 4
      const idxR = (y * SAMPLE + x + 1) * 4
      const idxB = ((y + 1) * SAMPLE + x) * 4

      // Horizontal and vertical gradient (luma)
      const lumaC = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
      const lumaR = data[idxR] * 0.299 + data[idxR + 1] * 0.587 + data[idxR + 2] * 0.114
      const lumaB = data[idxB] * 0.299 + data[idxB + 1] * 0.587 + data[idxB + 2] * 0.114
      const grad = Math.abs(lumaR - lumaC) + Math.abs(lumaB - lumaC)

      const onBoundary = (x % BLOCK === 0) || (y % BLOCK === 0)
      if (onBoundary) {
        boundaryGrad += grad
        boundaryCount++
      } else {
        nonBoundaryGrad += grad
        nonBoundaryCount++
      }
    }
  }

  const avgBoundary = boundaryCount > 0 ? boundaryGrad / boundaryCount : 0
  const avgNonBoundary = nonBoundaryCount > 0 ? nonBoundaryGrad / nonBoundaryCount : 0

  if (avgNonBoundary > 0 && avgBoundary > 1.5 * avgNonBoundary) {
    return 'photo-compressed'
  }

  return 'photo'
}

// ── Lanczos2 graphic path (verbatim from upscaler-worker.ts) ──────────────────

function lanczosWeight(x: number, radius: number): number {
  const ax = Math.abs(x)
  if (ax === 0) return 1
  if (ax >= radius) return 0
  const norm = ax / radius
  const pnorm = Math.PI * norm
  return (Math.sin(pnorm) / pnorm) * (Math.sin(pnorm * 0.5) / (pnorm * 0.5))
}

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
  const radiusX = Math.max(2, 2 / scaleX)
  const radiusY = Math.max(2, 2 / scaleY)

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

  const STRIP_H = 64
  const out    = new OffscreenCanvas(targetW, targetH)
  const outCtx = out.getContext('2d')!

  for (let ty0 = 0; ty0 < targetH; ty0 += STRIP_H) {
    const ty1      = Math.min(targetH, ty0 + STRIP_H)
    const nOutRows = ty1 - ty0

    const sy0f = (ty0 + 0.5) / scaleY - 0.5
    const sy1f = (ty1 - 0.5) / scaleY - 0.5
    const sy0  = Math.max(0, Math.floor(sy0f - radiusY))
    const sy1  = Math.min(srcH - 1, Math.ceil(sy1f + radiusY))
    const nSrcRows = sy1 - sy0 + 1

    const srcStrip = new OffscreenCanvas(srcW, nSrcRows)
    srcStrip.getContext('2d')!.drawImage(bitmap, 0, sy0, srcW, nSrcRows, 0, 0, srcW, nSrcRows)
    const srcData = srcStrip.getContext('2d')!.getImageData(0, 0, srcW, nSrcRows).data

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

    // Unsharp mask
    const USM_STRENGTH = 0.35
    const orig = new Uint8ClampedArray(outPx)
    for (let ry = 0; ry < nOutRows; ry++) {
      const prevRy = Math.max(0, ry - 1)
      const nextRy = Math.min(nOutRows - 1, ry + 1)
      for (let rx = 0; rx < targetW; rx++) {
        const ci = (ry      * targetW + rx) * 4
        const li = (ry      * targetW + Math.max(0, rx - 1)) * 4
        const ri = (ry      * targetW + Math.min(targetW - 1, rx + 1)) * 4
        const ti = (prevRy  * targetW + rx) * 4
        const bi = (nextRy  * targetW + rx) * 4
        for (let c = 0; c < 3; c++) {
          const lap = 4 * orig[ci + c] - orig[li + c] - orig[ri + c] - orig[ti + c] - orig[bi + c]
          outPx[ci + c] = Math.max(0, Math.min(255, orig[ci + c] + USM_STRENGTH * lap))
        }
      }
    }

    outCtx.putImageData(outImg, 0, ty0)
    onProgress(Math.round((ty1 / targetH) * 90))
    await new Promise<void>(r => setTimeout(r, 0))
  }

  return out
}

// ── Tile grid helpers ──────────────────────────────────────────────────────────

function buildStarts(dim: number, tileSize: number): number[] {
  const starts: number[] = []
  for (let pos = 0; pos < dim; pos += tileSize) starts.push(pos)
  return starts
}

const TILE_PX = 128
const OVERLAP = 8
const SAFE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SCALE_NUM: Record<UpscaleScale, number> = { '2x': 2, '3x': 3, '4x': 4, '8x': 8 }
const MAX_CANVAS_DIM  = 8192
const MAX_GRAPHIC_DIM = 16384

// ── Run ONNX tiling on a bitmap ────────────────────────────────────────────────

async function runOnnxTiling(
  id: string,
  bitmap: ImageBitmap,
  modelId: string,
  chainScale: number,
  onProgress: (done: number, total: number) => void
): Promise<OffscreenCanvas> {
  const srcW = bitmap.width
  const srcH = bitmap.height
  const outW = srcW * chainScale
  const outH = srcH * chainScale

  const xStarts = buildStarts(srcW, TILE_PX)
  const yStarts = buildStarts(srcH, TILE_PX)
  const total   = xStarts.length * yStarts.length
  let done = 0

  const acc = new GaussianAccumulator(outW, outH)

  for (const sy of yStarts) {
    for (const sx of xStarts) {
      const tw = Math.min(TILE_PX, srcW - sx)
      const th = Math.min(TILE_PX, srcH - sy)

      const padL = sx > 0 ? OVERLAP : 0
      const padT = sy > 0 ? OVERLAP : 0
      const padR = sx + tw < srcW ? OVERLAP : 0
      const padB = sy + th < srcH ? OVERLAP : 0

      const extX = sx - padL
      const extY = sy - padT
      const extW = tw + padL + padR
      const extH = th + padT + padB

      // Extract tile with overlap as ImageData
      const tileCanvas = new OffscreenCanvas(extW, extH)
      tileCanvas.getContext('2d')!.drawImage(bitmap, extX, extY, extW, extH, 0, 0, extW, extH)
      const tileData = tileCanvas.getContext('2d')!.getImageData(0, 0, extW, extH)

      // Convert RGBA → RGB for RawImage
      const rgbData = new Uint8Array(extW * extH * 3)
      for (let i = 0; i < extW * extH; i++) {
        rgbData[i * 3]     = tileData.data[i * 4]
        rgbData[i * 3 + 1] = tileData.data[i * 4 + 1]
        rgbData[i * 3 + 2] = tileData.data[i * 4 + 2]
      }

      const result = await inferTile(
        modelId,
        // scale is just for model-progress messages during lazy load; pass as '4x' placeholder
        '4x',
        extW,
        extH,
        rgbData,
        tileData.data,
        id
      )

      // Validate tile output shape
      if (result.width !== extW * chainScale || result.height !== extH * chainScale) {
        throw new Error(
          `Swin2SR tile shape mismatch: expected ${extW * chainScale}×${extH * chainScale}, got ${result.width}×${result.height}`
        )
      }

      // Accumulate tile with Gaussian weights (covers full tile including overlap)
      const sigma = extW * chainScale * 0.35
      const destX = (sx - padL) * chainScale
      const destY = (sy - padT) * chainScale
      acc.accumulate(result.rgba, result.width, result.height, destX, destY, sigma)

      done++
      onProgress(done, total)
    }
  }

  // Normalize all accumulated tile contributions and write to output canvas
  const normalizedRGBA = acc.normalize()
  const out    = new OffscreenCanvas(outW, outH)
  const outCtx = out.getContext('2d')!
  outCtx.putImageData(new ImageData(normalizedRGBA, outW, outH), 0, 0)

  return out
}

// ── Main inference ─────────────────────────────────────────────────────────────

async function runInference(
  id: string,
  scale: UpscaleScale,
  buffer: ArrayBuffer,
  mimeType: string,
  outputFormat?: string,
  imageMode: ImageMode = 'auto'
) {
  // Wait for model device negotiation to complete (webgpu timeout → wasm fallback).
  // Without this, inferTile picks up activeDevice='webgpu' before loadModel finishes,
  // then hangs awaiting the stalled WebGPU pipeline promise.
  await ensureModel(scale)

  const rawMime = outputFormat ?? mimeType
  const outMime = SAFE_MIMES.has(rawMime) ? rawMime : 'image/png'
  const scaleFactor = SCALE_NUM[scale]

  // Decode source image
  const blob   = new Blob([buffer], { type: mimeType })
  const bitmap = await createImageBitmap(blob)
  let workBitmap: ImageBitmap = bitmap

  try {
    const srcW = bitmap.width
    const srcH = bitmap.height

    // Canvas size guard (photo/ONNX path)
    let workW = srcW
    let workH = srcH
    if (srcW * scaleFactor > MAX_CANVAS_DIM || srcH * scaleFactor > MAX_CANVAS_DIM) {
      const limitRatio = Math.min(
        MAX_CANVAS_DIM / (srcW * scaleFactor),
        MAX_CANVAS_DIM / (srcH * scaleFactor)
      )
      workW = Math.round(srcW * limitRatio)
      workH = Math.round(srcH * limitRatio)
      const scaleCanvas = new OffscreenCanvas(workW, workH)
      scaleCanvas.getContext('2d')!.drawImage(bitmap, 0, 0, workW, workH)
      workBitmap = await createImageBitmap(scaleCanvas)
      self.postMessage({
        type: 'log',
        id,
        message: `Source scaled ${srcW}×${srcH} → ${workW}×${workH} to fit GPU canvas limit`,
      })
    }

    // Resolve image mode
    const resolvedMode: 'photo' | 'photo-compressed' | 'graphic' =
      imageMode === 'auto' ? detectImageMode(workBitmap) :
      imageMode === 'photo-compressed' ? 'photo-compressed' :
      imageMode === 'graphic' ? 'graphic' : 'photo'

    self.postMessage({ type: 'log', id, message: `Image mode: ${resolvedMode}${imageMode === 'auto' ? ' (auto-detected)' : ''}` })

    // ── Graphic path ───────────────────────────────────────────────────────────
    if (resolvedMode === 'graphic') {
      const rawOutW = srcW * scaleFactor
      const rawOutH = srcH * scaleFactor
      const capRatio = Math.min(1, MAX_GRAPHIC_DIM / rawOutW, MAX_GRAPHIC_DIM / rawOutH)
      const capW = Math.round(rawOutW * capRatio)
      const capH = Math.round(rawOutH * capRatio)
      if (capRatio < 1) {
        self.postMessage({ type: 'log', id, message: `Graphic: capping output ${rawOutW}×${rawOutH} → ${capW}×${capH}` })
      }
      const out = await graphicScale(
        bitmap,
        capW,
        capH,
        (pct) => self.postMessage({ type: 'infer-progress', id, progress: pct })
      )
      self.postMessage({ type: 'infer-progress', id, progress: 95 })
      const resultBlob   = await out.convertToBlob({ type: outMime, quality: 0.92 })
      const resultBuffer = await resultBlob.arrayBuffer()
      self.postMessage({ type: 'infer-progress', id, progress: 100 })
      self.postMessage({ type: 'infer-result', id, result: resultBuffer, outputMime: outMime }, [resultBuffer])
      return
    }

    // ── Photo path: Swin2SR tiling ─────────────────────────────────────────────

    self.postMessage({ type: 'infer-progress', id, progress: 10 })

    const photoMode: PhotoMode = resolvedMode === 'photo-compressed' ? 'photo-compressed' : 'photo'
    const routing = modelRouting(scale, photoMode)

    // Run chain (single model for most scales; two models for 8×)
    let currentBitmap = workBitmap
    let isFirst = true

    for (const chain of routing.chains) {
      const chainBitmap = currentBitmap
      const tileCanvas = await runOnnxTiling(
        id,
        chainBitmap,
        chain.modelId,
        chain.scale,
        (done, total) => {
          // Progress range 10–85 for all chained tiles
          const chainIdx = routing.chains.indexOf(chain)
          const chainCount = routing.chains.length
          const chainStart = 10 + chainIdx * (75 / chainCount)
          const chainEnd   = 10 + (chainIdx + 1) * (75 / chainCount)
          const pct = chainStart + (done / total) * (chainEnd - chainStart)
          self.postMessage({ type: 'infer-progress', id, progress: Math.round(pct) })
        }
      )

      // Close intermediate bitmaps (but not the original workBitmap if we're looping)
      if (!isFirst && chainBitmap !== bitmap && chainBitmap !== workBitmap) {
        chainBitmap.close()
      }
      isFirst = false

      // Convert canvas to bitmap for the next chain step (or final output)
      if (routing.chains.indexOf(chain) < routing.chains.length - 1) {
        currentBitmap = await createImageBitmap(tileCanvas)
      } else {
        // Final step: handle 3× special case (run 4× model then bicubic 0.75× downsample)
        if (scale === '3x') {
          const finalW = Math.round(workW * 3)
          const finalH = Math.round(workH * 3)
          const downCanvas = new OffscreenCanvas(finalW, finalH)
          downCanvas.getContext('2d')!.drawImage(
            tileCanvas as unknown as CanvasImageSource,
            0, 0, finalW, finalH
          )
          self.postMessage({ type: 'infer-progress', id, progress: 95 })
          const resultBlob   = await downCanvas.convertToBlob({ type: outMime, quality: 0.92 })
          const resultBuffer = await resultBlob.arrayBuffer()
          self.postMessage({ type: 'infer-progress', id, progress: 100 })
          self.postMessage({ type: 'infer-result', id, result: resultBuffer, outputMime: outMime }, [resultBuffer])
          return
        }

        // Normal output
        self.postMessage({ type: 'infer-progress', id, progress: 95 })
        const resultBlob   = await tileCanvas.convertToBlob({ type: outMime, quality: 0.92 })
        const resultBuffer = await resultBlob.arrayBuffer()
        self.postMessage({ type: 'infer-progress', id, progress: 100 })
        self.postMessage({ type: 'infer-result', id, result: resultBuffer, outputMime: outMime }, [resultBuffer])
        return
      }
    }
  } finally {
    bitmap.close()
    if (workBitmap !== bitmap) workBitmap.close()
  }
}

// ── Message router ─────────────────────────────────────────────────────────────

// Serial queue for infer messages: prevents concurrent inference from corrupting
// shared state (activeDevice) and from creating duplicate pipeline instances.
let _inferQueue = Promise.resolve()

self.addEventListener('message', async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data

  if (msg.type === 'load') {
    // Reset the inference queue — clears any stuck inference from a prior attempt in the same tab
    _inferQueue = Promise.resolve()
    try {
      await ensureModel(msg.scale)
    } catch (err) {
      self.postMessage({ type: 'error', message: (err as Error).message })
    }
    return
  }

  if (msg.type === 'infer') {
    const { id, scale, buffer, mimeType, outputFormat, imageMode } = msg
    _inferQueue = _inferQueue.then(() =>
      runInference(id, scale, buffer, mimeType, outputFormat, imageMode).catch(err =>
        self.postMessage({ type: 'error', id, message: (err as Error).message })
      )
    )
  }
})

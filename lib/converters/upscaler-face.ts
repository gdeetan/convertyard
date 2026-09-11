export interface FaceBox {
  x: number
  y: number
  w: number
  h: number
}

export const GFPGAN_SIZE = 512

export function expandFaceBox(
  box: FaceBox,
  imgW: number,
  imgH: number,
  pad = 0.3
): FaceBox {
  const extraW = box.w * pad
  const extraH = box.h * pad
  const x = Math.max(0, Math.floor(box.x - extraW))
  const y = Math.max(0, Math.floor(box.y - extraH))
  const right = Math.min(imgW, Math.ceil(box.x + box.w + extraW))
  const bottom = Math.min(imgH, Math.ceil(box.y + box.h + extraH))
  return { x, y, w: Math.max(1, right - x), h: Math.max(1, bottom - y) }
}

/** Elliptical falloff: 1 at centre, 0 at the axis-aligned rim. */
export function featherWeight(px: number, py: number, w: number, h: number): number {
  if (w <= 1 || h <= 1) return 1
  const nx = (px + 0.5) / w * 2 - 1
  const ny = (py + 0.5) / h * 2 - 1
  const r = Math.sqrt(nx * nx + ny * ny)
  if (r >= 1) return 0
  if (r <= 0.55) return 1
  return 1 - (r - 0.55) / 0.45
}

export function rgbaToGfpganNchw(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const plane = width * height
  const nchw = new Float32Array(3 * plane)
  for (let i = 0; i < plane; i++) {
    nchw[i] = rgba[i * 4] / 127.5 - 1
    nchw[plane + i] = rgba[i * 4 + 1] / 127.5 - 1
    nchw[2 * plane + i] = rgba[i * 4 + 2] / 127.5 - 1
  }
  return nchw
}

export function gfpganNchwToRgba(
  nchw: Float32Array | ArrayLike<number>,
  width: number,
  height: number
): Uint8ClampedArray {
  const plane = width * height
  const rgba = new Uint8ClampedArray(plane * 4)
  for (let i = 0; i < plane; i++) {
    rgba[i * 4] = Math.round(Math.min(255, Math.max(0, (nchw[i] + 1) * 127.5)))
    rgba[i * 4 + 1] = Math.round(Math.min(255, Math.max(0, (nchw[plane + i] + 1) * 127.5)))
    rgba[i * 4 + 2] = Math.round(Math.min(255, Math.max(0, (nchw[2 * plane + i] + 1) * 127.5)))
    rgba[i * 4 + 3] = 255
  }
  return rgba
}

export function pasteFace(
  base: Uint8ClampedArray,
  baseW: number,
  baseH: number,
  face: Uint8ClampedArray,
  faceW: number,
  faceH: number,
  box: FaceBox
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(base)
  for (let y = 0; y < box.h; y++) {
    const srcY = Math.min(faceH - 1, Math.floor((y + 0.5) * faceH / box.h))
    for (let x = 0; x < box.w; x++) {
      const destX = box.x + x
      const destY = box.y + y
      if (destX < 0 || destY < 0 || destX >= baseW || destY >= baseH) continue
      const w = featherWeight(x, y, box.w, box.h)
      if (w <= 0) continue
      const srcX = Math.min(faceW - 1, Math.floor((x + 0.5) * faceW / box.w))
      const si = (srcY * faceW + srcX) * 4
      const di = (destY * baseW + destX) * 4
      out[di]     = Math.round(out[di]     * (1 - w) + face[si]     * w)
      out[di + 1] = Math.round(out[di + 1] * (1 - w) + face[si + 1] * w)
      out[di + 2] = Math.round(out[di + 2] * (1 - w) + face[si + 2] * w)
    }
  }
  return out
}

/** Decode UltraFace-style [x1,y1,x2,y2,score] rows already in pixel space. */
export function filterFaceDetections(
  rows: Array<FaceBox & { score: number }>,
  minScore = 0.6,
  maxFaces = 8
): FaceBox[] {
  return rows
    .filter((r) => r.score >= minScore && r.w >= 12 && r.h >= 12)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFaces)
    .map(({ x, y, w, h }) => ({ x, y, w, h }))
}

function sigmoid(x: number): number {
  if (x >= 0 && x <= 1) return x
  return 1 / (1 + Math.exp(-x))
}

function boxIou(a: FaceBox, b: FaceBox): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.w, b.x + b.w)
  const y2 = Math.min(a.y + a.h, b.y + b.h)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const union = a.w * a.h + b.w * b.h - inter
  return union <= 0 ? 0 : inter / union
}

export function nmsFaceBoxes(
  boxes: Array<FaceBox & { score: number }>,
  iouThreshold = 0.3
): FaceBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score)
  const kept: Array<FaceBox & { score: number }> = []
  for (const box of sorted) {
    if (kept.some((k) => boxIou(k, box) >= iouThreshold)) continue
    kept.push(box)
  }
  return kept.map(({ x, y, w, h }) => ({ x, y, w, h }))
}

export interface YunetHead {
  data: ArrayLike<number>
  dims?: number[]
}

/** OpenCV YuNet v2 heads: cls/obj/bbox at strides 8, 16, 32. */
export function decodeYunetHeads(
  heads: Record<string, YunetHead>,
  detW: number,
  detH: number,
  imgW: number,
  imgH: number,
  minScore = 0.6
): FaceBox[] {
  const strides = [8, 16, 32]
  const raw: Array<FaceBox & { score: number }> = []
  const sx = imgW / detW
  const sy = imgH / detH

  for (const stride of strides) {
    const cls = heads[`cls_${stride}`]
    const obj = heads[`obj_${stride}`]
    const bbox = heads[`bbox_${stride}`]
    if (!cls || !obj || !bbox) continue
    const cols = Math.floor(detW / stride)
    const rows = Math.floor(detH / stride)
    const count = rows * cols
    for (let idx = 0; idx < count; idx++) {
      const score = Math.sqrt(sigmoid(cls.data[idx] ?? 0) * sigmoid(obj.data[idx] ?? 0))
      if (score < minScore) continue
      const r = Math.floor(idx / cols)
      const c = idx - r * cols
      const cx = (c + bbox.data[idx * 4]) * stride
      const cy = (r + bbox.data[idx * 4 + 1]) * stride
      const bw = Math.exp(bbox.data[idx * 4 + 2]) * stride
      const bh = Math.exp(bbox.data[idx * 4 + 3]) * stride
      raw.push({
        x: (cx - bw / 2) * sx,
        y: (cy - bh / 2) * sy,
        w: bw * sx,
        h: bh * sy,
        score,
      })
    }
  }

  return nmsFaceBoxes(raw)
}

/**
 * YuNet / FaceDetectorYN-style rows: [x, y, w, h, score, ...landmarks]
 * Coordinates are in the detector input space; scale them to the source image.
 */
export function decodeYunetRows(
  data: ArrayLike<number>,
  stride: number,
  detW: number,
  detH: number,
  imgW: number,
  imgH: number,
  minScore = 0.6
): FaceBox[] {
  if (stride < 5) return []
  const rows: Array<FaceBox & { score: number }> = []
  const n = Math.floor(data.length / stride)
  const sx = imgW / detW
  const sy = imgH / detH
  for (let i = 0; i < n; i++) {
    const o = i * stride
    const score = data[o + 4]
    if (score < minScore) continue
    const x = data[o] * sx
    const y = data[o + 1] * sy
    const w = data[o + 2] * sx
    const h = data[o + 3] * sy
    rows.push({ x, y, w, h, score })
  }
  return filterFaceDetections(rows, minScore)
}

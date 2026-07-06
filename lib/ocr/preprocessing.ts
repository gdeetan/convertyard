// Canvas-based image preprocessing for handwriting OCR.
// Pipeline: grayscale → gaussian blur → perspective correction → contrast stretch
//           → Sauvola adaptive binarization → ruled-line removal → deskew → upscale

const MIN_WIDTH_PX = 1500

export async function preprocessForOcr(blob: Blob): Promise<Blob> {
  if (typeof OffscreenCanvas === 'undefined') return blob

  const bmp = await createImageBitmap(blob)
  const { width: origW, height: origH } = bmp

  const canvas = new OffscreenCanvas(origW, origH)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  bmp.close()

  const imageData = ctx.getImageData(0, 0, origW, origH)
  const data = imageData.data

  // 1. Grayscale — luminance-weighted, handles colored ink
  const gray = new Uint8Array(origW * origH)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  }

  // 2. Gaussian denoising — reduces sensor noise before binarization
  const denoised = gaussianBlur(gray, origW, origH)

  // 3. Perspective correction — flatten trapezoid warp from angled photos
  let workGray = denoised
  let workW = origW
  let workH = origH
  const corners = detectDocumentCorners(denoised, origW, origH)
  if (corners) {
    const corrected = applyPerspectiveCorrection(denoised, origW, origH, corners)
    workGray = corrected.data
    workW = corrected.w
    workH = corrected.h
  }

  // 4. Contrast stretch — remap [p2, p98] → [0, 255]
  const sorted = workGray.slice().sort((a, b) => a - b)
  const lo = sorted[Math.floor(workGray.length * 0.02)]
  const hi = sorted[Math.floor(workGray.length * 0.98)]
  const range = hi - lo || 1
  const stretched = new Uint8Array(workGray.length)
  for (let i = 0; i < workGray.length; i++) {
    stretched[i] = Math.min(255, Math.max(0, Math.round(((workGray[i] - lo) / range) * 255)))
  }

  // 5. Sauvola adaptive binarization
  const binary = sauvolaBinarize(stretched, workW, workH)

  // 6. Ruled-line removal
  removeRuledLines(binary, workW, workH)

  // 7. Deskew — find rotation angle via projection profile, rotate
  const angle = estimateSkewAngle(binary, workW, workH)
  const sinA = Math.sin(angle)
  const cosA = Math.cos(angle)
  const needsRotate = Math.abs(angle) > 0.01

  const outW = needsRotate
    ? Math.round(Math.abs(workW * cosA) + Math.abs(workH * sinA))
    : workW
  const outH = needsRotate
    ? Math.round(Math.abs(workW * sinA) + Math.abs(workH * cosA))
    : workH

  // 8. Upscale to min 1500px
  const scale = Math.max(1, MIN_WIDTH_PX / outW)
  const finalW = Math.round(outW * scale)
  const finalH = Math.round(outH * scale)

  const out = new OffscreenCanvas(finalW, finalH)
  const octx = out.getContext('2d')!
  octx.fillStyle = '#ffffff'
  octx.fillRect(0, 0, finalW, finalH)

  // Write binarized pixels to an intermediate canvas for rotation/upscale
  const workCanvas = new OffscreenCanvas(workW, workH)
  const wctx = workCanvas.getContext('2d')!
  const binData = wctx.createImageData(workW, workH)
  for (let i = 0; i < binary.length; i++) {
    const v = binary[i]
    binData.data[i * 4] = v
    binData.data[i * 4 + 1] = v
    binData.data[i * 4 + 2] = v
    binData.data[i * 4 + 3] = 255
  }
  wctx.putImageData(binData, 0, 0)

  if (needsRotate) {
    octx.translate(finalW / 2, finalH / 2)
    octx.rotate(angle)
    octx.scale(scale, scale)
    octx.drawImage(workCanvas, -workW / 2, -workH / 2)
  } else {
    octx.scale(scale, scale)
    octx.drawImage(workCanvas, 0, 0)
  }

  return out.convertToBlob({ type: 'image/png' })
}

// ── Gaussian blur (3×3 kernel) ────────────────────────────────────────────────

function gaussianBlur(gray: Uint8Array, w: number, h: number): Uint8Array {
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]
  const out = new Uint8Array(gray.length)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0, ki = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * w + (x + dx)] * kernel[ki++]
        }
      }
      out[y * w + x] = Math.round(sum / 16)
    }
  }
  for (let x = 0; x < w; x++) { out[x] = gray[x]; out[(h - 1) * w + x] = gray[(h - 1) * w + x] }
  for (let y = 0; y < h; y++) { out[y * w] = gray[y * w]; out[y * w + w - 1] = gray[y * w + w - 1] }
  return out
}

// ── Document corner detection (Sobel edge scan) ───────────────────────────────

function detectDocumentCorners(
  gray: Uint8Array, w: number, h: number
): [[number, number], [number, number], [number, number], [number, number]] | null {
  // Sobel edge detection on grayscale
  const edges = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -gray[(y-1)*w+(x-1)] + gray[(y-1)*w+(x+1)]
        - 2*gray[y*w+(x-1)] + 2*gray[y*w+(x+1)]
        - gray[(y+1)*w+(x-1)] + gray[(y+1)*w+(x+1)]
      const gy =
        -gray[(y-1)*w+(x-1)] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+(x+1)]
        + gray[(y+1)*w+(x-1)] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+(x+1)]
      edges[y * w + x] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  const edgeThresh = 60
  const scanDist = Math.min(w, h) * 0.6
  const d = 1 / Math.sqrt(2)

  const findCorner = (
    ox: number, oy: number, dx: number, dy: number
  ): [number, number] => {
    for (let s = 0; s < scanDist; s++) {
      const cx = Math.round(ox + dx * s)
      const cy = Math.round(oy + dy * s)
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) break
      for (let ny = cy - 2; ny <= cy + 2; ny++) {
        for (let nx = cx - 2; nx <= cx + 2; nx++) {
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && edges[ny * w + nx] > edgeThresh) {
            return [nx, ny]
          }
        }
      }
    }
    return [ox, oy]
  }

  const tl = findCorner(0,     0,      d,  d)
  const tr = findCorner(w - 1, 0,     -d,  d)
  const br = findCorner(w - 1, h - 1, -d, -d)
  const bl = findCorner(0,     h - 1,  d, -d)

  // Require detected quad to cover 20–95% of the image — skip if already flat/cropped
  const spanX = Math.min(tr[0] - tl[0], br[0] - bl[0])
  const spanY = Math.min(bl[1] - tl[1], br[1] - tr[1])
  if (spanX < w * 0.2 || spanY < h * 0.2) return null
  if (spanX > w * 0.95 && spanY > h * 0.95) return null

  return [tl, tr, br, bl]
}

// ── Homography solver (Direct Linear Transform) ───────────────────────────────

function computeHomography(
  src: [number, number][],
  dst: [number, number][]
): number[] | null {
  // Direct Linear Transform — solves 8×8 system for H with h33=1
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = src[i]
    const [dx, dy] = dst[i]
    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx])
    b.push(dx)
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy])
    b.push(dy)
  }
  const n = 8
  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row
    }
    ;[A[col], A[maxRow]] = [A[maxRow], A[col]]
    ;[b[col], b[maxRow]] = [b[maxRow], b[col]]
    if (Math.abs(A[col][col]) < 1e-10) return null
    for (let row = col + 1; row < n; row++) {
      const f = A[row][col] / A[col][col]
      for (let k = col; k < n; k++) A[row][k] -= f * A[col][k]
      b[row] -= f * b[col]
    }
  }
  const h = new Array<number>(n)
  for (let i = n - 1; i >= 0; i--) {
    h[i] = b[i]
    for (let j = i + 1; j < n; j++) h[i] -= A[i][j] * h[j]
    h[i] /= A[i][i]
  }
  return [...h, 1]
}

// ── Perspective correction (inverse homography warp) ─────────────────────────

function applyPerspectiveCorrection(
  gray: Uint8Array,
  w: number,
  h: number,
  corners: [[number, number], [number, number], [number, number], [number, number]]
): { data: Uint8Array; w: number; h: number } {
  const [tl, tr, br, bl] = corners
  const dist = (a: [number, number], b: [number, number]) =>
    Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)

  const dstW = Math.round(Math.max(dist(tl, tr), dist(bl, br)))
  const dstH = Math.round(Math.max(dist(tl, bl), dist(tr, br)))

  // Inverse homography: dst pixel → src pixel (avoids holes in output)
  const H = computeHomography(
    [[0, 0], [dstW, 0], [dstW, dstH], [0, dstH]],
    [tl, tr, br, bl]
  )
  if (!H) return { data: gray, w, h }

  const [h1, h2, h3, h4, h5, h6, h7, h8, h9] = H
  const out = new Uint8Array(dstW * dstH).fill(255)

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const denom = h7 * dx + h8 * dy + h9
      if (Math.abs(denom) < 1e-10) continue
      const sx = (h1 * dx + h2 * dy + h3) / denom
      const sy = (h4 * dx + h5 * dy + h6) / denom
      const x0 = Math.floor(sx), y0 = Math.floor(sy)
      if (x0 < 0 || y0 < 0 || x0 + 1 >= w || y0 + 1 >= h) continue
      const fx = sx - x0, fy = sy - y0
      out[dy * dstW + dx] = Math.round(
        gray[y0 * w + x0]           * (1 - fx) * (1 - fy) +
        gray[y0 * w + x0 + 1]       * fx       * (1 - fy) +
        gray[(y0 + 1) * w + x0]     * (1 - fx) * fy       +
        gray[(y0 + 1) * w + x0 + 1] * fx       * fy
      )
    }
  }
  return { data: out, w: dstW, h: dstH }
}

// ── Sauvola adaptive binarization ────────────────────────────────────────────
//
// Splits the image into blocks, computes local mean + std per block,
// then applies T = mean × (1 + k × (std/R − 1)) per pixel.
// k=0.2, R=128 are standard Sauvola parameters.
// Falls back to global Otsu if Sauvola produces < 0.3% black pixels
// (happens on already-clean scanned docs with near-zero local variance).

function sauvolaBinarize(gray: Uint8Array, w: number, h: number): Uint8Array {
  const k = 0.2
  const R = 128
  const blockSize = Math.max(16, Math.min(32, Math.floor(w / 50)))
  const threshMap = new Float32Array(w * h)

  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      const x1 = Math.min(bx + blockSize, w)
      const y1 = Math.min(by + blockSize, h)
      let sum = 0, sumSq = 0, n = 0
      for (let y = by; y < y1; y++) {
        for (let x = bx; x < x1; x++) {
          const v = gray[y * w + x]
          sum += v
          sumSq += v * v
          n++
        }
      }
      const mean = sum / n
      const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean))
      const thresh = mean * (1 + k * (std / R - 1))
      for (let y = by; y < y1; y++) {
        for (let x = bx; x < x1; x++) {
          threshMap[y * w + x] = thresh
        }
      }
    }
  }

  const binary = new Uint8Array(w * h)
  let blackCount = 0
  for (let i = 0; i < binary.length; i++) {
    if (gray[i] < threshMap[i]) { binary[i] = 0; blackCount++ } else { binary[i] = 255 }
  }

  // Fallback to Otsu if Sauvola underperformed (very uniform/clean image)
  if (blackCount / binary.length < 0.003) {
    const thresh = otsuThreshold(gray)
    for (let i = 0; i < binary.length; i++) {
      binary[i] = gray[i] < thresh ? 0 : 255
    }
  }

  return binary
}

// ── Ruled-line removal ────────────────────────────────────────────────────────
//
// A ruled notebook line appears as a row where a single horizontal black run
// spans > 55% of the image width. Text characters create many short runs,
// not a single long one — so this rarely erases real text.
// Also catches multi-row lines by merging adjacent erased rows.

function removeRuledLines(binary: Uint8Array, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    let maxRun = 0
    let currentRun = 0
    for (let x = 0; x < w; x++) {
      if (binary[y * w + x] === 0) {
        if (++currentRun > maxRun) maxRun = currentRun
      } else {
        currentRun = 0
      }
    }
    if (maxRun > w * 0.55) {
      for (let x = 0; x < w; x++) binary[y * w + x] = 255
    }
  }
}

// ── Otsu global threshold (fallback) ─────────────────────────────────────────

function otsuThreshold(gray: Uint8Array): number {
  const hist = new Float64Array(256)
  for (const v of gray) hist[v]++
  const total = gray.length
  for (let i = 0; i < 256; i++) hist[i] /= total

  let sumB = 0, wB = 0, sum1 = 0, maxVar = 0, thresh = 128
  for (let i = 0; i < 256; i++) sum1 += i * hist[i]
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = 1 - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum1 - sumB) / wF
    const v = wB * wF * (mB - mF) ** 2
    if (v > maxVar) { maxVar = v; thresh = t }
  }
  return thresh
}

// ── Projection profile deskew ─────────────────────────────────────────────────

function estimateSkewAngle(binary: Uint8Array, w: number, h: number): number {
  // Two-pass coarse-to-fine: 21 candidates at 2° + 17 candidates at 0.25° around winner
  const scoreCandidates = (candidates: number[]): number => {
    let bestAngle = 0
    let bestScore = -1
    for (const deg of candidates) {
      const rad = (deg * Math.PI) / 180
      const sin = Math.sin(rad)
      const cos = Math.cos(rad)
      const profile = new Int32Array(h)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = Math.round(x * cos - y * sin + (h * sin) / 2)
          const ny = Math.round(x * sin + y * cos - (w * sin) / 2)
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (binary[ny * w + nx] === 0) profile[y]++
          }
        }
      }
      let mean = 0, count = 0
      for (const v of profile) { if (v > 0) { mean += v; count++ } }
      if (count === 0) continue
      mean /= count
      let variance = 0
      for (const v of profile) { if (v > 0) variance += (v - mean) ** 2 }
      variance /= count
      if (variance > bestScore) { bestScore = variance; bestAngle = deg }
    }
    return bestAngle
  }

  // Pass 1: coarse sweep ±20° at 2° steps (21 candidates)
  const coarse: number[] = []
  for (let deg = -20; deg <= 20; deg += 2) coarse.push(deg)
  const coarseWinner = scoreCandidates(coarse)

  // Pass 2: fine sweep ±2° around coarse winner at 0.25° steps (17 candidates)
  const fine: number[] = []
  for (let deg = coarseWinner - 2; deg <= coarseWinner + 2; deg += 0.25) {
    fine.push(Math.round(deg * 100) / 100)
  }
  const fineWinner = scoreCandidates(fine)

  return -(fineWinner * Math.PI) / 180
}

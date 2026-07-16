// Canvas-based image preprocessing for handwriting OCR.
// Pipeline: grayscale → gaussian blur → perspective correction → CLAHE
//           → Sauvola adaptive binarization → ruled-line removal → deskew → upscale
import { diagLog } from '@/lib/debug/mobile-diagnostics'

const MIN_WIDTH_PX = 1500
const MIN_WIDTH_PX_RECEIPT = 2500

// Render a grayscale pixel array to a deskewed+upscaled canvas blob.
function renderGrayToBlob(
  pixels: Uint8Array,
  w: number, h: number,
  finalW: number, finalH: number,
  angle: number, scale: number
): Promise<Blob> {
  const needsRotate = Math.abs(angle) > 0.01
  const workCanvas = new OffscreenCanvas(w, h)
  const wctx = workCanvas.getContext('2d')!
  const imgData = wctx.createImageData(w, h)
  for (let i = 0; i < pixels.length; i++) {
    const v = pixels[i]
    imgData.data[i * 4] = v
    imgData.data[i * 4 + 1] = v
    imgData.data[i * 4 + 2] = v
    imgData.data[i * 4 + 3] = 255
  }
  wctx.putImageData(imgData, 0, 0)

  const out = new OffscreenCanvas(finalW, finalH)
  const octx = out.getContext('2d')!
  octx.fillStyle = '#ffffff'
  octx.fillRect(0, 0, finalW, finalH)
  if (needsRotate) {
    octx.translate(finalW / 2, finalH / 2)
    octx.rotate(angle)
    octx.scale(scale, scale)
    octx.drawImage(workCanvas, -w / 2, -h / 2)
  } else {
    octx.scale(scale, scale)
    octx.drawImage(workCanvas, 0, 0)
  }
  return out.convertToBlob({ type: 'image/png' })
}

// ── Unsharp masking ───────────────────────────────────────────────────────────
// Sharpens after CLAHE to crisp up small characters before binarization.
// amount=1.2 gives strong but not halation-inducing sharpening.
function unsharpMask(gray: Uint8Array, w: number, h: number): Uint8Array {
  const blurred = gaussianBlur(gray, w, h)
  const out = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.max(0, Math.min(255, Math.round(gray[i] + 1.2 * (gray[i] - blurred[i]))))
  }
  return out
}

// createImageBitmap fails on some JPEG variants (CMYK, unusual ICC profiles,
// Samsung HDR metadata). Fall back to an <img> element which is more lenient.
async function decodeBlobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob)
  } catch {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        try {
          const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight)
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          resolve(canvas.transferToImageBitmap())
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('The source image could not be decoded.'))
      }
      img.src = url
    })
  }
}

// Core pipeline — returns both binarized output (for line detection) and
// CLAHE grayscale output (for TrOCR inference, preserves natural pixel distribution).
async function preprocessCore(blob: Blob, minWidth = MIN_WIDTH_PX): Promise<{
  binary: Blob
  grayscale: Blob
} | null> {
  if (typeof OffscreenCanvas === 'undefined') return null

  const bmp = await decodeBlobToImageBitmap(blob)
  const { width: origW, height: origH } = bmp
  diagLog('preprocess-canvas', `${origW}x${origH} minWidth=${minWidth}`)

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

  // 2b. Background illumination normalization — flattens shadows and gradients
  //     so perspective corner detection isn't confused by shadow edges
  const normalized = normalizeIllumination(denoised, origW, origH)

  // 3. Perspective correction — flatten trapezoid warp from angled photos
  let workGray = normalized
  let workW = origW
  let workH = origH
  const corners = detectDocumentCorners(normalized, origW, origH)
  if (corners) {
    const corrected = applyPerspectiveCorrection(normalized, origW, origH, corners)
    workGray = corrected.data
    workW = corrected.w
    workH = corrected.h
  }

  // 4. CLAHE — tile-based adaptive contrast normalization
  const clahe = applyCLAHE(workGray, workW, workH)

  // 4b. Unsharp masking — crisps small characters before binarization
  const sharpened = unsharpMask(clahe, workW, workH)

  // 5. Sauvola adaptive binarization
  const binary = sauvolaBinarize(sharpened, workW, workH)

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

  // 8. Upscale to minWidth
  const scale = Math.max(1, minWidth / outW)
  const finalW = Math.round(outW * scale)
  const finalH = Math.round(outH * scale)

  // Render both outputs with the same deskew + upscale transform
  const [binaryBlob, grayscaleBlob] = await Promise.all([
    renderGrayToBlob(binary, workW, workH, finalW, finalH, angle, scale),
    renderGrayToBlob(clahe, workW, workH, finalW, finalH, angle, scale),
  ])

  return { binary: binaryBlob, grayscale: grayscaleBlob }
}

export async function preprocessForOcr(blob: Blob, minWidth?: number): Promise<Blob> {
  const result = await preprocessCore(blob, minWidth)
  return result?.binary ?? blob
}

// Returns both the binarized image (for line detection) and the CLAHE grayscale
// image (for TrOCR inference). The grayscale preserves natural pixel intensity
// distribution that TrOCR was trained on — feeding binarized input causes
// distribution mismatch and hallucinations.
export async function preprocessForOcrDual(blob: Blob, minWidth?: number): Promise<{ binary: Blob; grayscale: Blob }> {
  const result = await preprocessCore(blob, minWidth)
  if (!result) return { binary: blob, grayscale: blob }
  return result
}

const SCREENSHOT_MIN_WIDTH = 1200
const SCREENSHOT_MAX_DIM = 4096    // iOS canvas cap: ~16.7 MP / 4096² side

// Exported for unit testing only
export function isDarkModeScreenshot(meanLuminance: number): boolean {
  return meanLuminance < 100
}

export function screenshotNeedsUpscale(width: number): boolean {
  return width < SCREENSHOT_MIN_WIDTH
}

// Near-passthrough preprocessing for clear screenshots and sharp digital images.
// Skips blur, CLAHE, binarization, deskew — those help messy photos but destroy
// pixel-perfect UI text. Only does: white-background composite, grayscale,
// dark-mode inversion, and conditional upscale.
export async function preprocessForScreenshot(blob: Blob): Promise<Blob> {
  if (typeof OffscreenCanvas === 'undefined') return blob

  const bmp = await decodeBlobToImageBitmap(blob)
  const origW = bmp.width
  const origH = bmp.height

  // Composite transparent backgrounds onto white + read pixels
  const canvas = new OffscreenCanvas(origW, origH)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, origW, origH)
  ctx.drawImage(bmp, 0, 0)
  bmp.close()

  const imageData = ctx.getImageData(0, 0, origW, origH)
  const { data } = imageData

  // Mean luminance for dark-mode detection
  let totalLum = 0
  for (let i = 0; i < data.length; i += 4) {
    totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  const meanLum = totalLum / (origW * origH)
  const isDark = isDarkModeScreenshot(meanLum)

  // Grayscale + invert if dark-mode (light text on dark → dark text on light)
  const gray = new Uint8Array(origW * origH)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    gray[i] = isDark ? 255 - lum : lum
  }

  // Upscale only when image is too narrow for reliable OCR
  const rawScale = screenshotNeedsUpscale(origW) ? SCREENSHOT_MIN_WIDTH / origW : 1
  const outW = Math.min(Math.round(origW * rawScale), SCREENSHOT_MAX_DIM)
  const outH = Math.min(Math.round(origH * rawScale), SCREENSHOT_MAX_DIM)
  const scale = Math.min(outW / origW, outH / origH)

  return renderGrayToBlob(gray, origW, origH, outW, outH, 0, scale)
}

// ── Separable box blur (O(n) regardless of radius) ───────────────────────────

function boxBlur(src: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  const size = 2 * radius + 1
  const tmp = new Uint8Array(src.length)

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    let sum = 0
    for (let x = -radius; x <= radius; x++) {
      sum += src[y * w + Math.max(0, Math.min(w - 1, x))]
    }
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = Math.round(sum / size)
      sum += src[y * w + Math.min(w - 1, x + radius + 1)]
            - src[y * w + Math.max(0, x - radius)]
    }
  }

  // Vertical pass
  const out = new Uint8Array(src.length)
  for (let x = 0; x < w; x++) {
    let sum = 0
    for (let y = -radius; y <= radius; y++) {
      sum += tmp[Math.max(0, Math.min(h - 1, y)) * w + x]
    }
    for (let y = 0; y < h; y++) {
      out[y * w + x] = Math.round(sum / size)
      sum += tmp[Math.min(h - 1, y + radius + 1) * w + x]
            - tmp[Math.max(0, y - radius) * w + x]
    }
  }
  return out
}

// ── Background illumination normalization ─────────────────────────────────────
// Estimates scene background via a large box blur (radius ≈ 12% of shorter
// dimension). Divides each pixel by its local background estimate and rescales
// to a 200-brightness target. Flattens shadows, gradients, and uneven lighting
// before perspective detection and CLAHE run — corner detection benefits because
// shadow edges no longer compete with document edges.
function normalizeIllumination(gray: Uint8Array, w: number, h: number): Uint8Array {
  const radius = Math.max(20, Math.round(Math.min(w, h) * 0.12))
  const bg = boxBlur(gray, w, h, radius)
  const out = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    const bgVal = Math.max(1, bg[i])
    out[i] = Math.min(255, Math.round((gray[i] / bgVal) * 200))
  }
  return out
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
  const scanDist = Math.hypot(w, h) * 0.45
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

  const origins: [number, number][] = [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]]
  const detected = [tl, tr, br, bl]
  const moved = detected.filter((c, i) => c[0] !== origins[i][0] || c[1] !== origins[i][1]).length
  if (moved < 3) return null

  // Top corners must be above bottom corners
  if (tl[1] >= bl[1] || tr[1] >= br[1]) return null

  // Require detected quad to cover 20% of the image in each dimension
  const spanX = Math.min(tr[0] - tl[0], br[0] - bl[0])
  const spanY = Math.min(bl[1] - tl[1], br[1] - tr[1])
  if (spanX < w * 0.2 || spanY < h * 0.2) return null

  // Skip if either dimension spans > 85% — image is already flat enough.
  // Using OR means flat photos (where one span is large) don't get incorrectly warped.
  if (spanX > w * 0.85 || spanY > h * 0.85) return null

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

// ── CLAHE (Contrast Limited Adaptive Histogram Equalization) ──────────────────
//
// Divides the image into an 8×8 tile grid. Per tile: builds a histogram,
// clips bins at clipLimit to prevent noise amplification, then builds a CDF.
// Each pixel is mapped using bilinear interpolation between the 4 surrounding
// tile CDFs — produces smooth transitions with no tile boundary artifacts.
// Handles uneven lighting (shadow on one side) that global stretch cannot fix.

function applyCLAHE(gray: Uint8Array, w: number, h: number): Uint8Array {
  const TILE_COLS = 8
  const TILE_ROWS = 8
  const tileW = Math.ceil(w / TILE_COLS)
  const tileH = Math.ceil(h / TILE_ROWS)

  // Build per-tile CDFs
  const cdfs: Uint8Array[][] = Array.from({ length: TILE_ROWS }, () => [])
  for (let tr = 0; tr < TILE_ROWS; tr++) {
    for (let tc = 0; tc < TILE_COLS; tc++) {
      const x0 = tc * tileW
      const y0 = tr * tileH
      const x1 = Math.min(x0 + tileW, w)
      const y1 = Math.min(y0 + tileH, h)
      const n = (x1 - x0) * (y1 - y0)

      const hist = new Float64Array(256)
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) hist[gray[y * w + x]]++
      }

      // Clip excess and redistribute uniformly
      const clipLimit = 4.0 * (n / 256)
      let excess = 0
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipLimit) { excess += hist[i] - clipLimit; hist[i] = clipLimit }
      }
      const add = excess / 256
      for (let i = 0; i < 256; i++) hist[i] += add

      // Normalize CDF to [0, 255]
      const cdf = new Uint8Array(256)
      let cum = 0
      for (let i = 0; i < 256; i++) {
        cum += hist[i]
        cdf[i] = Math.min(255, Math.round((cum / n) * 255))
      }
      cdfs[tr][tc] = cdf
    }
  }

  // Apply with bilinear interpolation between tile CDFs
  const out = new Uint8Array(gray.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = gray[y * w + x]
      // Position in tile grid relative to tile centers
      const tx = (x - tileW * 0.5) / tileW
      const ty = (y - tileH * 0.5) / tileH
      const tc0 = Math.max(0, Math.min(TILE_COLS - 2, Math.floor(tx)))
      const tr0 = Math.max(0, Math.min(TILE_ROWS - 2, Math.floor(ty)))
      const fx = Math.max(0, Math.min(1, tx - tc0))
      const fy = Math.max(0, Math.min(1, ty - tr0))
      out[y * w + x] = Math.round(
        cdfs[tr0][tc0][v]     * (1 - fx) * (1 - fy) +
        cdfs[tr0][tc0 + 1][v] * fx       * (1 - fy) +
        cdfs[tr0 + 1][tc0][v] * (1 - fx) * fy       +
        cdfs[tr0 + 1][tc0 + 1][v] * fx   * fy
      )
    }
  }
  return out
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

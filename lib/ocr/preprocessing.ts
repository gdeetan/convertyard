// Canvas-based image preprocessing for handwriting OCR.
// Pipeline: grayscale → contrast stretch → Sauvola adaptive binarization
//           → ruled-line removal → deskew → upscale

const MIN_WIDTH_PX = 1500

export async function preprocessForOcr(blob: Blob): Promise<Blob> {
  if (typeof OffscreenCanvas === 'undefined') return blob

  const bmp = await createImageBitmap(blob)
  const { width, height } = bmp

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  bmp.close()

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // 1. Grayscale — luminance-weighted, handles colored ink
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  }

  // 1b. Gaussian denoising — reduces sensor noise before binarization
  const denoised = gaussianBlur(gray, width, height)

  // 2. Contrast stretch — remap [p2, p98] → [0, 255]
  const sorted = denoised.slice().sort((a, b) => a - b)
  const lo = sorted[Math.floor(denoised.length * 0.02)]
  const hi = sorted[Math.floor(denoised.length * 0.98)]
  const range = hi - lo || 1
  const stretched = new Uint8Array(denoised.length)
  for (let i = 0; i < denoised.length; i++) {
    stretched[i] = Math.min(255, Math.max(0, Math.round(((denoised[i] - lo) / range) * 255)))
  }

  // 3. Sauvola adaptive binarization — per-block local threshold handles uneven lighting
  const binary = sauvolaBinarize(stretched, width, height)

  // 4. Ruled-line removal — erase horizontal lines that span > 55% of the width
  removeRuledLines(binary, width, height)

  // 5. Deskew — find rotation angle via projection profile, rotate
  const angle = estimateSkewAngle(binary, width, height)
  const sinA = Math.sin(angle)
  const cosA = Math.cos(angle)
  const needsRotate = Math.abs(angle) > 0.01

  const outW = needsRotate
    ? Math.round(Math.abs(width * cosA) + Math.abs(height * sinA))
    : width
  const outH = needsRotate
    ? Math.round(Math.abs(width * sinA) + Math.abs(height * cosA))
    : height

  const scale = Math.max(1, MIN_WIDTH_PX / outW)
  const finalW = Math.round(outW * scale)
  const finalH = Math.round(outH * scale)

  const out = new OffscreenCanvas(finalW, finalH)
  const octx = out.getContext('2d')!
  octx.fillStyle = '#ffffff'
  octx.fillRect(0, 0, finalW, finalH)

  // Write binarized pixels back to canvas for rotation/upscale
  const binData = ctx.createImageData(width, height)
  for (let i = 0; i < binary.length; i++) {
    const v = binary[i]
    binData.data[i * 4] = v
    binData.data[i * 4 + 1] = v
    binData.data[i * 4 + 2] = v
    binData.data[i * 4 + 3] = 255
  }
  canvas.width = width
  canvas.height = height
  ctx.putImageData(binData, 0, 0)

  if (needsRotate) {
    octx.translate(finalW / 2, finalH / 2)
    octx.rotate(angle)
    octx.scale(scale, scale)
    octx.drawImage(canvas, -width / 2, -height / 2)
  } else {
    octx.scale(scale, scale)
    octx.drawImage(canvas, 0, 0)
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
  const candidates: number[] = []
  for (let deg = -20; deg <= 20; deg += 0.25) {
    candidates.push(Math.round(deg * 100) / 100)
  }
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

    if (variance > bestScore) { bestScore = variance; bestAngle = rad }
  }

  return -bestAngle
}

// Canvas-based image preprocessing for handwriting OCR.
// Pipeline: grayscale → contrast stretch → Otsu binarization → deskew → upscale

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

  // 2. Contrast stretch — remap [p2, p98] → [0, 255]
  const sorted = gray.slice().sort((a, b) => a - b)
  const lo = sorted[Math.floor(gray.length * 0.02)]
  const hi = sorted[Math.floor(gray.length * 0.98)]
  const range = hi - lo || 1
  const stretched = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    stretched[i] = Math.min(255, Math.max(0, Math.round(((gray[i] - lo) / range) * 255)))
  }

  // 3. Otsu binarization — compute optimal global threshold
  const threshold = otsuThreshold(stretched)
  const binary = new Uint8Array(gray.length)
  for (let i = 0; i < binary.length; i++) {
    binary[i] = stretched[i] < threshold ? 0 : 255
  }

  // 4. Deskew — find rotation angle via projection profile, rotate
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

  // Write binarized pixels back to ImageData for rotation
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function otsuThreshold(gray: Uint8Array): number {
  const hist = new Float64Array(256)
  for (const v of gray) hist[v]++
  const total = gray.length
  for (let i = 0; i < 256; i++) hist[i] /= total

  let sumB = 0
  let wB = 0
  let sum1 = 0
  for (let i = 0; i < 256; i++) sum1 += i * hist[i]

  let maxVar = 0
  let thresh = 128
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

// Projection profile deskew: scan angles [-5°, +5°], pick max sharpness
function estimateSkewAngle(binary: Uint8Array, w: number, h: number): number {
  const candidates = [-5, -4, -3, -2, -1, -0.5, 0, 0.5, 1, 2, 3, 4, 5]
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

    // Score = variance of non-zero profile rows (higher = sharper lines)
    let mean = 0
    let count = 0
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

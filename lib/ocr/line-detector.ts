// Geometry-based line detector for handwriting OCR.
// Replaces Tesseract layout analysis in the AI-Enhanced path.
// Uses horizontal projection profiles + connected component bounding boxes
// on a binarized (black-on-white) image blob.

export interface LineBox {
  x: number
  y: number
  w: number
  h: number
}

export async function detectLines(binarizedBlob: Blob): Promise<LineBox[]> {
  if (typeof OffscreenCanvas === 'undefined') return []

  const bmp = await createImageBitmap(binarizedBlob)
  const W = bmp.width
  const H = bmp.height
  const canvas = new OffscreenCanvas(W, H)
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  ctx.drawImage(bmp, 0, 0)
  bmp.close()

  const data = ctx.getImageData(0, 0, W, H).data
  // 1 = black pixel, 0 = white
  const binary = new Uint8Array(W * H)
  for (let i = 0; i < binary.length; i++) {
    binary[i] = data[i * 4] < 128 ? 1 : 0
  }

  // Stage 1: Horizontal projection profile → smoothed row density
  const profile = new Int32Array(H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      profile[y] += binary[y * W + x]
    }
  }

  const smoothed = new Float32Array(H)
  for (let y = 0; y < H; y++) {
    let sum = 0, count = 0
    for (let dy = -2; dy <= 2; dy++) {
      const ry = y + dy
      if (ry >= 0 && ry < H) { sum += profile[ry]; count++ }
    }
    smoothed[y] = sum / count
  }

  // Detect text row bands (valleys = inter-line gaps)
  const minBlackPerRow = Math.max(1, W * 0.005)
  const bands: Array<{ y0: number; y1: number }> = []
  let inBand = false
  let bandStart = 0

  for (let y = 0; y < H; y++) {
    if (!inBand && smoothed[y] >= minBlackPerRow) {
      inBand = true
      bandStart = y
    } else if (inBand && smoothed[y] < minBlackPerRow) {
      inBand = false
      if (y - bandStart >= 4) bands.push({ y0: bandStart, y1: y })
    }
  }
  if (inBand && H - bandStart >= 4) bands.push({ y0: bandStart, y1: H })

  // Filter non-text bands: pens, rulers, horizontal objects have very high
  // per-row black pixel density (> 25% of width) across the entire band.
  // Tall bands (≥ 40px) are exempt — they're text lines, not pen strokes, even if
  // a noisy/colored background inflates their density above the threshold.
  const densityBands = bands.filter(({ y0, y1 }) => {
    const bh = y1 - y0
    if (bh >= 40) return true
    let total = 0
    for (let y = y0; y < y1; y++) total += profile[y]
    return total / Math.max(1, bh) < W * 0.25
  })

  // Filter bands that are too short to be text lines.
  // Pen label text / noise bands are typically 10–20px at 1500px width.
  // Real handwriting lines are 60px+ at that scale.
  const minBandH = Math.max(20, Math.round(W * 0.013))
  const textBands = densityBands.filter(b => (b.y1 - b.y0) >= minBandH)

  // Split bands that are too tall — they likely contain 2+ merged lines.
  // Find the lowest-density row in the middle portion of the band and split there.
  const heights = textBands.map(b => b.y1 - b.y0).sort((a, b) => a - b)
  const medianH = heights[Math.floor(heights.length / 2)] ?? H
  const splitBands = splitOversized(textBands, smoothed, medianH)

  // Stage 2: Per band → tight x-extent bounding box via connected components
  const lineBoxes: LineBox[] = []

  for (const { y0, y1 } of splitBands) {
    let minX = W, maxX = 0
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < W; x++) {
        if (binary[y * W + x] === 1) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
        }
      }
    }
    if (maxX >= minX) {
      // Pad y by 15% of band height to capture ascenders/descenders
      const pad = Math.round((y1 - y0) * 0.15)
      lineBoxes.push({
        x: Math.max(0, minX),
        y: Math.max(0, y0 - pad),
        w: maxX - minX + 1,
        h: Math.min(H, y1 + pad) - Math.max(0, y0 - pad),
      })
    }
  }

  // No lines detected — return empty so the caller can fall back to Tesseract.
  // The old behavior (return full image as one box) caused TrOCR to hallucinate
  // when noisy/decorated backgrounds fooled the density filter into removing all bands.

  return lineBoxes
}

// Split any band taller than 2× the median band height by finding the
// lowest-density row in the middle 60% of the band.
function splitOversized(
  bands: Array<{ y0: number; y1: number }>,
  smoothed: Float32Array,
  medianH: number
): Array<{ y0: number; y1: number }> {
  const maxH = Math.round(medianH * 2.0)
  const result: Array<{ y0: number; y1: number }> = []

  for (const band of bands) {
    const bh = band.y1 - band.y0
    if (bh <= maxH) {
      result.push(band)
      continue
    }
    // Search the middle 60% of the band for the row with minimum density
    const s = band.y0 + Math.round(bh * 0.2)
    const e = band.y1 - Math.round(bh * 0.2)
    let minVal = Infinity
    let splitRow = Math.floor((band.y0 + band.y1) / 2)
    for (let y = s; y <= e; y++) {
      if (smoothed[y] < minVal) { minVal = smoothed[y]; splitRow = y }
    }
    // Only split if the minimum is meaningfully lower than the band average
    let bandSum = 0
    for (let y = band.y0; y < band.y1; y++) bandSum += smoothed[y]
    const bandAvg = bandSum / bh
    if (minVal < bandAvg * 0.65 && splitRow > band.y0 + 4 && splitRow < band.y1 - 4) {
      result.push({ y0: band.y0, y1: splitRow })
      result.push({ y0: splitRow, y1: band.y1 })
    } else {
      result.push(band)
    }
  }

  return result
}

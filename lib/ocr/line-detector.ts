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
  const ctx = canvas.getContext('2d')!
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
  if (inBand) bands.push({ y0: bandStart, y1: H })

  // Stage 2: Per band → tight x-extent bounding box via connected components
  const lineBoxes: LineBox[] = []

  for (const { y0, y1 } of bands) {
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

  // Fallback: no lines detected → return full image as a single box
  if (lineBoxes.length === 0) {
    return [{ x: 0, y: 0, w: W, h: H }]
  }

  return lineBoxes
}

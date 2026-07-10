// Pixel-based column boundary detection for image-to-table modes.
// Two tiers: (1) Hough vertical line detection for ruled tables,
//            (2) vertical projection profile for borderless tables.
// Returns null if no confident signal → caller falls back to word-gap voting.

// ── Pure math helpers (exported for testing) ─────────────────────────────────

/** Gaussian-smooth an array in-place. sigma controls spread. */
export function gaussianSmooth(arr: Float32Array, sigma: number): Float32Array {
  const radius = Math.ceil(sigma * 3)
  const kernel: number[] = []
  let sum = 0
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma))
    kernel.push(v)
    sum += v
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum

  const out = new Float32Array(arr.length)
  for (let i = 0; i < arr.length; i++) {
    let acc = 0
    for (let k = -radius; k <= radius; k++) {
      const j = Math.max(0, Math.min(arr.length - 1, i + k))
      acc += arr[j] * kernel[k + radius]
    }
    out[i] = acc
  }
  return out
}

/**
 * Find local maxima in a smoothed array.
 * A position is a peak if it is strictly greater than its neighbours
 * and above `threshold`.
 */
export function findPeaks(arr: Float32Array, threshold: number): number[] {
  const peaks: number[] = []
  for (let i = 1; i < arr.length - 1; i++) {
    if (arr[i] > threshold && arr[i] > arr[i - 1] && arr[i] > arr[i + 1]) {
      peaks.push(i)
    }
  }
  return peaks
}

/**
 * Find local minima (valleys) in a smoothed array.
 * A position is a valley if it is strictly less than its neighbours
 * and below `threshold`.
 */
export function findValleys(arr: Float32Array, threshold: number): number[] {
  const valleys: number[] = []
  for (let i = 1; i < arr.length - 1; i++) {
    if (arr[i] < threshold && arr[i] <= arr[i - 1] && arr[i] <= arr[i + 1]) {
      valleys.push(i)
    }
  }
  return valleys
}

/**
 * Cluster nearby positions (within `tol` px of each other) into single
 * representatives (the mean of each cluster).
 */
export function clusterPositions(positions: number[], tol: number): number[] {
  if (positions.length === 0) return []
  const sorted = [...positions].sort((a, b) => a - b)
  const clusters: number[][] = [[sorted[0]]]
  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1]
    if (sorted[i] - last[last.length - 1] <= tol) {
      last.push(sorted[i])
    } else {
      clusters.push([sorted[i]])
    }
  }
  return clusters.map(c => Math.round(c.reduce((s, v) => s + v, 0) / c.length))
}

// ── Canvas-dependent detection ────────────────────────────────────────────────

/**
 * Try to detect vertical ruled lines (table gridlines) via a column-wise
 * Sobel X-gradient accumulation.
 *
 * Returns sorted column boundary X positions, or null if fewer than 2
 * vertical lines are found (not enough to define column structure).
 */
export function detectHoughColumns(
  binary: Uint8Array,   // 1 = black, 0 = white; row-major, width × height
  W: number,
  H: number,
): number[] | null {
  // Column-wise Sobel X: vote[x] += |pixel[x-1] - pixel[x+1]| > 64
  const votes = new Float32Array(W)
  for (let y = 0; y < H; y++) {
    for (let x = 1; x < W - 1; x++) {
      const left  = binary[y * W + x - 1]
      const right = binary[y * W + x + 1]
      if (Math.abs(left - right) > 0) votes[x]++
    }
  }

  // Smooth and find peaks (lines must span ≥25% of image height)
  const smoothed = gaussianSmooth(votes, 2.5)
  const threshold = H * 0.25
  const peaks = findPeaks(smoothed, threshold)
  if (peaks.length < 2) return null

  // Cluster peaks within 6px — multiple adjacent edge pixels → one line
  return clusterPositions(peaks, 6)
}

/**
 * Try to detect column gaps via a vertical projection profile.
 * Sums black pixels in each column, then finds valleys (gaps).
 *
 * Returns sorted column boundary X positions (valley midpoints),
 * or null if no confident gap is found.
 */
export function detectProjectionColumns(
  binary: Uint8Array,
  W: number,
  H: number,
): number[] | null {
  // Column density: fraction of black pixels per column
  const density = new Float32Array(W)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      density[x] += binary[y * W + x]
    }
  }
  for (let x = 0; x < W; x++) density[x] /= H   // normalise 0..1

  const smoothed = gaussianSmooth(density, 3.5)

  // Mean density across all columns
  let mean = 0
  for (let x = 0; x < W; x++) mean += smoothed[x]
  mean /= W

  // Valleys must be below 30% of mean AND below absolute 0.08 density
  const valleyThreshold = Math.min(mean * 0.3, 0.08)
  const valleys = findValleys(smoothed, valleyThreshold)

  // Valley must be at least 0.5% of image width wide (filter hairline noise)
  const minValleyWidth = Math.max(2, Math.round(W * 0.005))
  const wideValleys = valleys.filter(v => {
    let lo = v, hi = v
    while (lo > 0 && smoothed[lo - 1] <= valleyThreshold) lo--
    while (hi < W - 1 && smoothed[hi + 1] <= valleyThreshold) hi++
    return hi - lo >= minValleyWidth
  })

  if (wideValleys.length === 0) return null
  return clusterPositions(wideValleys, 8)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Detect column boundary X positions from a preprocessed binary image blob.
 *
 * Tries Hough vertical line detection first (best for ruled tables),
 * then vertical projection profile (best for borderless tables).
 * Returns null if neither technique finds a confident signal.
 */
export async function detectColumnBoundaries(
  binaryBlob: Blob,
  imageWidth: number,
  imageHeight: number,
): Promise<number[] | null> {
  if (typeof OffscreenCanvas === 'undefined') return null

  let data: Uint8ClampedArray
  try {
    const bmp = await createImageBitmap(binaryBlob)
    const canvas = new OffscreenCanvas(imageWidth, imageHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bmp, 0, 0)
    bmp.close()
    data = ctx.getImageData(0, 0, imageWidth, imageHeight).data
  } catch {
    return null
  }

  // Convert RGBA pixel data to binary (1 = black, 0 = white)
  const binary = new Uint8Array(imageWidth * imageHeight)
  for (let i = 0; i < binary.length; i++) {
    binary[i] = data[i * 4] < 128 ? 1 : 0
  }

  const hough = detectHoughColumns(binary, imageWidth, imageHeight)
  if (hough) return hough

  const projection = detectProjectionColumns(binary, imageWidth, imageHeight)
  if (projection) return projection

  return null
}

/**
 * Detect row boundary Y positions from a preprocessed binary image blob.
 *
 * Strategy A: horizontal gridlines (bordered tables) — rows where ≥50% of
 * pixels are dark indicate a ruled line; those Y positions become boundaries.
 *
 * Strategy B: projection valleys (borderless tables) — find horizontal bands
 * of whitespace (low dark-pixel density) between rows of text.
 *
 * Returns null if fewer than 2 row boundaries are found.
 */
export async function detectRowBoundaries(
  binaryBlob: Blob,
  imageWidth: number,
  imageHeight: number,
): Promise<number[] | null> {
  if (typeof OffscreenCanvas === 'undefined') return null

  let data: Uint8ClampedArray
  try {
    const bmp = await createImageBitmap(binaryBlob)
    const canvas = new OffscreenCanvas(imageWidth, imageHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bmp, 0, 0)
    bmp.close()
    data = ctx.getImageData(0, 0, imageWidth, imageHeight).data
  } catch {
    return null
  }

  // Horizontal density profile: fraction of dark pixels per row
  const profile = new Float32Array(imageHeight)
  for (let y = 0; y < imageHeight; y++) {
    let dark = 0
    for (let x = 0; x < imageWidth; x++) {
      if (data[(y * imageWidth + x) * 4] < 128) dark++
    }
    profile[y] = dark / imageWidth
  }

  // Strategy A: horizontal gridlines (bordered tables)
  const lineYs: number[] = []
  for (let y = 1; y < imageHeight - 1; y++) {
    if (profile[y] >= 0.5 && profile[y] >= profile[y - 1] && profile[y] >= profile[y + 1]) {
      lineYs.push(y)
    }
  }
  const clusteredLines = clusterPositions(lineYs, 4)
  if (clusteredLines.length >= 2) {
    const bounds = [0, ...clusteredLines, imageHeight]
    if (bounds.length >= 4) return bounds
  }

  // Strategy B: whitespace valleys (borderless tables)
  const smoothed = gaussianSmooth(profile, 1.5)
  const GAP_THRESHOLD = 0.03
  const MIN_GAP_PX = 4
  const bounds: number[] = [0]
  let inGap = false
  let gapStart = 0
  for (let y = 0; y < imageHeight; y++) {
    if (smoothed[y] < GAP_THRESHOLD) {
      if (!inGap) { inGap = true; gapStart = y }
    } else {
      if (inGap && y - gapStart >= MIN_GAP_PX) {
        bounds.push(Math.round((gapStart + y) / 2))
      }
      inGap = false
    }
  }
  bounds.push(imageHeight)
  return bounds.length >= 4 ? bounds : null
}

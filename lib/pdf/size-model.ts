// Empirical size predictor for the compress-pdf ladder. Lets the ladder
// skip rungs that would obviously overshoot the target. Miss just falls
// back to walking the next rung — correctness surface is small.

// Bytes-per-pixel at quality=70 (MozJPEG anchor). The spec's original
// 0.00013 was orders of magnitude off; 0.5 overshoots typical MozJPEG
// output (which lands around 0.15–0.35 bpp) but keeps the model usable
// as a rung-skip heuristic. If the model over-picks a rung, the ladder
// loop's `best` tracking preserves correctness — worst case we walk one
// extra rung. Heuristic pending calibration against a real benchmark
// fixture.
const A = 0.5
const SLOPE = 0.028          // relative bytes-per-quality
const FIXED_OVERHEAD = 8_000 // per-image dict/xref/header
// Assumed quality of the structural (pre-recompress) image bytes when
// subtracting them from baselineBytes to isolate non-image overhead.
// Roughly "structural output looks like JPEG Q85".
const STRUCTURAL_INPUT_QUALITY = 85

export function predictOutputBytes(input: {
  totalPixels: number
  quality: number
  dpiRatio: number
  baselineBytes: number
}): number {
  const { totalPixels, quality, dpiRatio, baselineBytes } = input
  const clampedRatio = Math.max(0.05, Math.min(1, dpiRatio))
  const scaledPixels = totalPixels * clampedRatio * clampedRatio
  const qMul = 1 + (quality - 70) * SLOPE
  const imageBytes = scaledPixels * A * qMul + FIXED_OVERHEAD
  const asWasQualityMul = 1 + (STRUCTURAL_INPUT_QUALITY - 70) * SLOPE
  const asWasImageBytes = totalPixels * A * asWasQualityMul
  const nonImageBytes = Math.max(0, baselineBytes - asWasImageBytes)
  return Math.round(imageBytes + nonImageBytes)
}

export function chooseRungForTarget(input: {
  rungs: Array<{ quality: number; dpiRatio: number }>
  totalPixels: number
  baselineBytes: number
  targetBytes: number
}): number {
  const { rungs, totalPixels, baselineBytes, targetBytes } = input
  for (let i = 0; i < rungs.length; i++) {
    const predicted = predictOutputBytes({
      totalPixels,
      quality: rungs[i].quality,
      dpiRatio: rungs[i].dpiRatio,
      baselineBytes,
    })
    if (predicted <= targetBytes) return i
  }
  return rungs.length - 1
}

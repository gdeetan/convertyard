// Empirical size predictor for the compress-pdf ladder. Lets the ladder
// skip rungs that would obviously overshoot the target. Miss just falls
// back to walking the next rung — correctness surface is small.

const A = 0.5                // bytes per pixel at quality=70 (MozJPEG anchor)
const SLOPE = 0.028          // relative bytes-per-quality
const FIXED_OVERHEAD = 8_000 // per-image dict/xref/header

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
  const asWasImageBytes = totalPixels * A * (1 + 15 * SLOPE)
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

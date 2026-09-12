// Pure helpers for the video-compressor calibration workflow: extrapolate
// final size / ETA from a short real encode, solve for the bitrate that hits
// a target file size, enforce a resolution-scaled floor below which visible
// blocking is likely.

export interface CalibrationSample {
  measuredBps: number    // bits per second observed during calibration
  measuredFps: number    // encoder frames per wall-clock second
  calibFrames: number    // frames actually encoded during calibration
  calibBytes: number     // encoded bytes produced during calibration
  calibSeconds: number   // source seconds covered by calibration
}

export function estimateSizeFromCalibration(
  args: { measuredBps: number; durationSeconds: number },
): number {
  return Math.round((args.measuredBps * args.durationSeconds) / 8)
}

export function estimateEtaFromCalibration(
  args: { framesRemaining: number; measuredFps: number },
): number {
  if (args.measuredFps <= 0) return Infinity
  return args.framesRemaining / args.measuredFps
}

export function bitrateForTargetSize(
  args: { targetBytes: number; durationSeconds: number },
): number {
  if (args.durationSeconds <= 0) return 0
  return Math.floor((args.targetBytes * 8) / args.durationSeconds)
}

// Below this bits-per-second baseline at 854×480, high-motion content starts
// blocking visibly. Scale linearly with pixel count so 1080p and 4K get a
// proportionally higher floor.
const FLOOR_BASELINE_BPS = 200_000
const FLOOR_BASELINE_PIXELS = 854 * 480

export function bitrateFloor(args: { width: number; height: number }): number {
  const pixels = Math.max(1, args.width * args.height)
  return Math.round(FLOOR_BASELINE_BPS * (pixels / FLOOR_BASELINE_PIXELS))
}

export function applyBitrateFloor(
  args: { bps: number; width: number; height: number },
): number {
  const floor = bitrateFloor({ width: args.width, height: args.height })
  return Math.max(args.bps, floor)
}

export function isTargetAchievable(args: {
  targetBytes: number
  durationSeconds: number
  width: number
  height: number
}): { achievable: boolean; minAchievableBytes: number; requiredBps: number } {
  const requiredBps = bitrateForTargetSize({
    targetBytes: args.targetBytes,
    durationSeconds: args.durationSeconds,
  })
  const floor = bitrateFloor({ width: args.width, height: args.height })
  const minAchievableBytes = Math.round((floor * args.durationSeconds) / 8)
  return {
    achievable: requiredBps >= floor,
    minAchievableBytes,
    requiredBps,
  }
}

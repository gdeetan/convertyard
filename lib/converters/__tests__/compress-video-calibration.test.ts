import { describe, it, expect } from 'vitest'
import {
  estimateSizeFromCalibration,
  estimateEtaFromCalibration,
  bitrateForTargetSize,
  bitrateFloor,
  applyBitrateFloor,
  isTargetAchievable,
} from '../compress-video-calibration'

describe('estimateSizeFromCalibration', () => {
  it('scales linearly by duration', () => {
    // 4 Mbps × 60 s / 8 = 30_000_000 bytes
    const bytes = estimateSizeFromCalibration({ measuredBps: 4_000_000, durationSeconds: 60 })
    expect(bytes).toBe(30_000_000)
  })

  it('returns 0 for zero duration', () => {
    expect(estimateSizeFromCalibration({ measuredBps: 4_000_000, durationSeconds: 0 })).toBe(0)
  })
})

describe('estimateEtaFromCalibration', () => {
  it('returns remaining seconds based on measured fps', () => {
    expect(estimateEtaFromCalibration({ framesRemaining: 300, measuredFps: 30 })).toBe(10)
  })

  it('returns Infinity when fps is 0', () => {
    expect(estimateEtaFromCalibration({ framesRemaining: 300, measuredFps: 0 })).toBe(Infinity)
  })
})

describe('bitrateForTargetSize', () => {
  it('computes bps to hit a target size for a duration', () => {
    // 10 MB × 8 / 60 s ≈ 1_398_101 bps
    const bps = bitrateForTargetSize({ targetBytes: 10 * 1024 * 1024, durationSeconds: 60 })
    expect(bps).toBeCloseTo(Math.floor((10 * 1024 * 1024 * 8) / 60), -1)
  })

  it('returns 0 for zero duration', () => {
    expect(bitrateForTargetSize({ targetBytes: 10 * 1024 * 1024, durationSeconds: 0 })).toBe(0)
  })
})

describe('bitrateFloor', () => {
  it('returns baseline at 854x480', () => {
    expect(bitrateFloor({ width: 854, height: 480 })).toBe(200_000)
  })

  it('scales with pixel count for 1080p', () => {
    const f480 = bitrateFloor({ width: 854, height: 480 })
    const f1080 = bitrateFloor({ width: 1920, height: 1080 })
    expect(f1080).toBeGreaterThan(f480 * 4)
  })

  it('scales down for tiny resolutions', () => {
    const f = bitrateFloor({ width: 320, height: 240 })
    expect(f).toBeLessThan(bitrateFloor({ width: 854, height: 480 }))
  })
})

describe('applyBitrateFloor', () => {
  it('raises below-floor bitrate to floor', () => {
    const out = applyBitrateFloor({ bps: 50_000, width: 1920, height: 1080 })
    expect(out).toBeGreaterThan(50_000)
    expect(out).toBe(bitrateFloor({ width: 1920, height: 1080 }))
  })

  it('leaves above-floor bitrate untouched', () => {
    const out = applyBitrateFloor({ bps: 5_000_000, width: 1920, height: 1080 })
    expect(out).toBe(5_000_000)
  })
})

describe('isTargetAchievable', () => {
  it('returns false when target math dips below floor', () => {
    const r = isTargetAchievable({
      targetBytes: 1 * 1024 * 1024,
      durationSeconds: 600,
      width: 1920,
      height: 1080,
    })
    expect(r.achievable).toBe(false)
    expect(r.minAchievableBytes).toBeGreaterThan(1 * 1024 * 1024)
  })

  it('returns true when comfortably above floor', () => {
    const r = isTargetAchievable({
      targetBytes: 200 * 1024 * 1024,
      durationSeconds: 60,
      width: 1920,
      height: 1080,
    })
    expect(r.achievable).toBe(true)
  })
})

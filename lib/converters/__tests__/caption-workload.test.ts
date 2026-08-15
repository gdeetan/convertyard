import { describe, expect, it } from 'vitest'
import { captionWorkloadWarning } from '../caption-workload'

describe('captionWorkloadWarning', () => {
  it('is silent for a short 1080p clip', () => {
    expect(captionWorkloadWarning({
      durationSec: 45,
      width: 1920,
      height: 1080,
      bytes: 12 * 1024 * 1024,
    })).toBeNull()
  })

  it('warns on long duration, 4K, or large files', () => {
    expect(captionWorkloadWarning({
      durationSec: 240,
      width: 1280,
      height: 720,
      bytes: 10 * 1024 * 1024,
    })).toMatch(/4 minutes/)

    expect(captionWorkloadWarning({
      durationSec: 30,
      width: 3840,
      height: 2160,
      bytes: 10 * 1024 * 1024,
    })).toMatch(/3840×2160/)

    expect(captionWorkloadWarning({
      durationSec: 30,
      width: 1280,
      height: 720,
      bytes: 120 * 1024 * 1024,
    })).toMatch(/120 MB/)
  })
})

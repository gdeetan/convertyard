import { describe, it, expect } from 'vitest'
import { isDarkModeScreenshot, screenshotNeedsUpscale } from '@/lib/ocr/preprocessing'

describe('isDarkModeScreenshot', () => {
  it('returns true when mean luminance is below 100 (dark background)', () => {
    expect(isDarkModeScreenshot(40)).toBe(true)
    expect(isDarkModeScreenshot(99)).toBe(true)
  })

  it('returns false when mean luminance is 100 or above (light background)', () => {
    expect(isDarkModeScreenshot(100)).toBe(false)
    expect(isDarkModeScreenshot(180)).toBe(false)
    expect(isDarkModeScreenshot(255)).toBe(false)
  })

  it('treats exact boundary value 100 as light mode', () => {
    expect(isDarkModeScreenshot(100)).toBe(false)
  })
})

describe('screenshotNeedsUpscale', () => {
  it('returns true for images narrower than 1200px', () => {
    expect(screenshotNeedsUpscale(800)).toBe(true)
    expect(screenshotNeedsUpscale(1199)).toBe(true)
  })

  it('returns false for images 1200px or wider', () => {
    expect(screenshotNeedsUpscale(1200)).toBe(false)
    expect(screenshotNeedsUpscale(1920)).toBe(false)
    expect(screenshotNeedsUpscale(3840)).toBe(false)
  })
})

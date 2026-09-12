import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('mobile codec gating', () => {
  const originalUA = globalThis.navigator?.userAgent
  const setUA = (ua: string) => {
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: ua, configurable: true })
  }
  beforeEach(() => { vi.resetModules() })
  afterEach(() => { if (originalUA) setUA(originalUA) })

  it('mobileAllowsHevc returns false on iOS', async () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    const { mobileAllowsHevc } = await import('../compress-video-webcodecs')
    expect(mobileAllowsHevc()).toBe(false)
  })

  it('mobileAllowsHevc returns false on Android', async () => {
    setUA('Mozilla/5.0 (Linux; Android 13; Pixel 7)')
    const { mobileAllowsHevc } = await import('../compress-video-webcodecs')
    expect(mobileAllowsHevc()).toBe(false)
  })

  it('mobileAllowsHevc returns true on desktop Chrome', async () => {
    setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120')
    const { mobileAllowsHevc } = await import('../compress-video-webcodecs')
    expect(mobileAllowsHevc()).toBe(true)
  })
})

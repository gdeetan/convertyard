import { describe, expect, it } from 'vitest'

import { mediabunnyVideoTarget } from '../compress-video-mediabunny'

describe('mediabunnyVideoTarget', () => {
  it('asks mediabunny to scale to 1080p by height only so rotation and aspect stay intact', () => {
    expect(mediabunnyVideoTarget('1080p', 2160)).toEqual({ height: 1080, fit: 'contain' })
  })

  it('does not resize when the source is already 1080p or smaller', () => {
    expect(mediabunnyVideoTarget('1080p', 1080)).toBeUndefined()
    expect(mediabunnyVideoTarget('1080p', 720)).toBeUndefined()
  })

  it('does not resize Original', () => {
    expect(mediabunnyVideoTarget('original', 2160)).toBeUndefined()
  })
})

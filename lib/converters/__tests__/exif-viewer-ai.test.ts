import { describe, it, expect } from 'vitest'
import { detectAiSignatures } from '../exif-viewer-ai'

describe('detectAiSignatures', () => {
  it('detects Stable Diffusion via PNG parameters chunk', () => {
    const sigs = detectAiSignatures({ parameters: 'a cat on a mat, masterpiece' })
    expect(sigs[0]).toMatchObject({ generator: 'stable-diffusion' })
    expect(sigs[0].detail).toContain('a cat on a mat')
  })

  it('detects ComfyUI when workflow chunk present', () => {
    const sigs = detectAiSignatures({ workflow: '{"nodes":[]}' })
    expect(sigs[0]).toMatchObject({ generator: 'comfyui' })
  })

  it('detects Midjourney via dc:creator', () => {
    const sigs = detectAiSignatures({ 'dc:creator': 'Midjourney' })
    expect(sigs[0]).toMatchObject({ generator: 'midjourney' })
  })

  it('detects DALL·E via Software tag', () => {
    const sigs = detectAiSignatures({ Software: 'DALL·E 3' })
    expect(sigs[0]).toMatchObject({ generator: 'dalle' })
  })

  it('detects Adobe Firefly via CreatorTool', () => {
    const sigs = detectAiSignatures({ 'xmp:CreatorTool': 'Adobe Firefly' })
    expect(sigs[0]).toMatchObject({ generator: 'firefly' })
  })

  it('reports c2pa-only when only the C2PA flag is present', () => {
    const sigs = detectAiSignatures({}, { hasC2pa: true })
    expect(sigs).toContainEqual(expect.objectContaining({ generator: 'c2pa-only' }))
  })

  it('returns empty when no signals match', () => {
    expect(detectAiSignatures({ Software: 'iOS 17' })).toEqual([])
  })
})

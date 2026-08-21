import { describe, it, expect } from 'vitest'
import { buildCsv, buildHtmlReport, buildJsonZip } from '../exif-viewer-export'
import type { AnalyzeResult } from '../exif-viewer.types'

const ok: AnalyzeResult = {
  ok: true, fileName: 'IMG_0001.jpg', fileSize: 12345, mimeType: 'image/jpeg',
  width: 4000, height: 3000, groups: [],
  gps: { lat: 37.7749, lon: -122.4194 },
  privacyFlags: [{ severity: 'high', tag: 'GPSLatitude', message: 'x', fixGroup: 'gps' }],
  aiSignatures: [], raw: { Make: 'Canon', Model: 'EOS R5', ISO: 400 },
}
const fail: AnalyzeResult = {
  ok: false, fileName: 'broken.jpg', fileSize: 100, mimeType: 'image/jpeg',
  reason: 'parse-error', message: 'boom',
}

describe('buildCsv', () => {
  it('produces one header row plus one row per result', () => {
    const csv = buildCsv([ok, fail])
    const lines = csv.trim().split('\n')
    expect(lines.length).toBe(3)
    expect(lines[0]).toContain('filename')
    expect(lines[0]).toContain('privacy_flags')
    expect(lines[1]).toContain('IMG_0001.jpg')
  })
  it('escapes commas and quotes in values', () => {
    const csv = buildCsv([{ ...ok, raw: { Copyright: 'A, "B" & C' } as any }])
    expect(csv).toContain('"A, ""B"" & C"')
  })
})

describe('buildHtmlReport', () => {
  it('returns valid-looking HTML containing every filename', async () => {
    const html = await buildHtmlReport([ok, fail])
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('IMG_0001.jpg')
    expect(html).toContain('broken.jpg')
  })
})

describe('buildJsonZip', () => {
  it('returns a Blob and non-empty size', async () => {
    const blob = await buildJsonZip([ok])
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })
})

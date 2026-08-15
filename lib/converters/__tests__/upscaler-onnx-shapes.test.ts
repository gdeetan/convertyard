import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function ascii(buf: Buffer) {
  return buf.toString('latin1')
}

describe('Real-ESRGAN ONNX shape metadata', () => {
  it('marks AnimeVideo v3 output spatial dims as 4× so WebGPU does not reuse the input buffer', () => {
    const text = ascii(readFileSync('public/models/realesr-animevideov3.onnx'))
    expect(text).toContain('height_x4')
    expect(text).toContain('width_x4')
  })
})

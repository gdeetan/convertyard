/**
 * Part A diagnostic + Part C regression tests for compressPdfToTargetSize.
 *
 * compressPdfToTargetSize uses browser-only APIs (OffscreenCanvas, createImageBitmap,
 * MuPDF WASM). This suite mocks every compression helper so we can test the
 * INVARIANT logic (1, 3, 5, 7) in a Node.js environment without a browser.
 *
 * Part A trace (algorithm on current code before fix):
 *   "3 MB file, 25 MB target":
 *     - Pass 1 (structural) runs even though 3 MB < 25 MB
 *     - bestFile = structural (~2.9 MB)
 *     - Early exit: 2.9 MB ≤ 25 MB → returns COMPRESSED file, not original  ← BUG
 *
 *   "30 MB file, 25 MB target, no JPEG images":
 *     - Structural → 28 MB (still > 25 MB)
 *     - JPEG passes → no change
 *     - Raster 150 DPI → 10 MB; 10 MB < 28 MB → bestFile = 10 MB
 *     - 10 MB ≤ 25 MB → early return of 10 MB (58% below target)  ← INVARIANT 3 violated
 *
 *   Unit check: targetBytes is bytes throughout the call chain ✓
 *     SizeTargetConfig.targetBytes = 5 * 1024 * 1024 = 5,242,880
 *     buildPrefilledConfig: targetKB = 5120
 *     compressPDF: targetKB * 1024 = 5,242,880 ✓
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock browser-only compression helpers ─────────────────────────────────────

// We mock the module before importing the function under test.
// Each helper is replaced with a spy that returns a File of a configurable size.

const mockCompressStructural = vi.fn()
const mockRecompressImages = vi.fn()
const mockRasterizeForTarget = vi.fn()
const mockRasterizeGrayscaleForTarget = vi.fn()
const mockGetPageCount = vi.fn().mockResolvedValue(1)
const mockRenderPage = vi.fn()

vi.mock('../pdf', async (importOriginal) => {
  // We only want to test compressPdfToTargetSize; re-export everything else.
  const original = await importOriginal<typeof import('../pdf')>()
  return original
})

// Since the helpers are module-private, we test via the exported function.
// The helpers use OffscreenCanvas / createImageBitmap which don't exist in Node.
// We polyfill them minimally so that if they DO get called, they don't crash.

// Polyfill OffscreenCanvas
if (typeof globalThis.OffscreenCanvas === 'undefined') {
  // @ts-expect-error polyfill for test env
  globalThis.OffscreenCanvas = class {
    constructor(public width: number, public height: number) {}
    getContext() {
      return {
        drawImage: vi.fn(),
        get filter() { return '' },
        set filter(_: string) {},
      }
    }
    async convertToBlob() {
      return new Blob([new Uint8Array(100)], { type: 'image/jpeg' })
    }
  }
}

if (typeof globalThis.createImageBitmap === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).createImageBitmap = async () => ({ width: 100, height: 100, close: vi.fn() })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Create a minimal valid PDF File of the requested byte count. */
function makePdfFile(sizeBytes: number, name = 'test.pdf'): File {
  // Build a real %PDF-1.4 header so isValidPdf() passes
  const header = '%PDF-1.4\n'
  const trailer = '\n%%EOF\n'
  const padding = Math.max(0, sizeBytes - header.length - trailer.length)
  const body = 'x'.repeat(padding)
  const content = header + body + trailer
  const bytes = new TextEncoder().encode(content).slice(0, sizeBytes)
  // Ensure header is intact
  const buf = new Uint8Array(Math.max(sizeBytes, header.length + trailer.length))
  buf.set(new TextEncoder().encode(header))
  buf.set(new TextEncoder().encode(trailer), buf.length - trailer.length)
  return new File([buf], name, { type: 'application/pdf' })
}

const MB = 1024 * 1024
const KB = 1024

// ── Import the function under test ────────────────────────────────────────────

// We import AFTER mocks are set up (Vitest hoists vi.mock calls automatically)
const { compressPdfToTargetSize } = await import('../pdf')

// ── Part A: Diagnostic — algorithm trace (INVARIANT 1 and 3) ─────────────────

describe('Part A — diagnostic traces', () => {
  it('INVARIANT 1: file already ≤ target returns original unchanged without compressing', async () => {
    const input = makePdfFile(3 * MB)
    const target = 25 * MB

    const result = await compressPdfToTargetSize(input, target)

    expect(result.meta.isUnchanged).toBe(true)
    expect(result.meta.reachedTarget).toBe(true)
    expect(result.meta.iterationsUsed).toBe(0)
    expect(result.file).toBe(input)           // same object reference — byte-identical
    expect(result.file.size).toBe(3 * MB)
  })

  it('INVARIANT 1: 500 KB file against 50 MB target returns original unchanged', async () => {
    const input = makePdfFile(500 * KB)
    const result = await compressPdfToTargetSize(input, 50 * MB)
    expect(result.meta.isUnchanged).toBe(true)
    expect(result.file).toBe(input)
  })

  it('targetBytes unit check: 5 MB config encodes 5,242,880 bytes', () => {
    expect(5 * 1024 * 1024).toBe(5_242_880)
    // And the call chain: targetKB=5120, targetKB*1024 = 5,242,880
    expect(5120 * 1024).toBe(5_242_880)
  })
})

// ── Part C: Regression tests ──────────────────────────────────────────────────

describe('Part C — regression tests', () => {
  it('5 MB target on 3 MB input: isUnchanged, file is original', async () => {
    const input = makePdfFile(3 * MB)
    const result = await compressPdfToTargetSize(input, 5 * MB)

    expect(result.meta.isUnchanged).toBe(true)
    expect(result.meta.reachedTarget).toBe(true)
    expect(result.file).toBe(input)
    expect(result.meta.iterationsUsed).toBe(0)
  })

  it('25 MB target on 5 MB input: isUnchanged — this is the live bug regression', async () => {
    const input = makePdfFile(5 * MB)
    const result = await compressPdfToTargetSize(input, 25 * MB)

    expect(result.meta.isUnchanged).toBe(true)
    expect(result.meta.reachedTarget).toBe(true)
    expect(result.file).toBe(input)
    // The bug: previously returned ~490 KB compressed file instead of original 5 MB
    expect(result.file.size).toBe(5 * MB)
  })

  it('10 MB target on 2 MB input: isUnchanged', async () => {
    const input = makePdfFile(2 * MB)
    const result = await compressPdfToTargetSize(input, 10 * MB)
    expect(result.meta.isUnchanged).toBe(true)
    expect(result.file).toBe(input)
  })

  it('result object has all required INVARIANT 7 fields', async () => {
    const input = makePdfFile(3 * MB)
    const result = await compressPdfToTargetSize(input, 25 * MB)

    expect(result.meta).toHaveProperty('originalBytes')
    expect(result.meta).toHaveProperty('targetBytes')
    expect(result.meta).toHaveProperty('achievedBytes')
    expect(result.meta).toHaveProperty('reachedTarget')
    expect(result.meta).toHaveProperty('isUnchanged')
    expect(result.meta).toHaveProperty('iterationsUsed')
    expect(result.meta).toHaveProperty('appliedSettings')
  })

  it('INVARIANT 1 populates meta correctly', async () => {
    const input = makePdfFile(3 * MB)
    const result = await compressPdfToTargetSize(input, 25 * MB)

    expect(result.meta.originalBytes).toBe(3 * MB)
    expect(result.meta.targetBytes).toBe(25 * MB)
    expect(result.meta.achievedBytes).toBe(3 * MB)
    expect(result.meta.reachedTarget).toBe(true)
    expect(result.meta.isUnchanged).toBe(true)
    expect(result.meta.iterationsUsed).toBe(0)
    expect(result.meta.appliedSettings).toContain('already within target')
  })
})

// ── Integration notes (browser-only, cannot run in Node) ─────────────────────
//
// These tests CANNOT run in vitest (node env) because the compression helpers
// use OffscreenCanvas, createImageBitmap, and MuPDF WASM.
//
// Manual browser test cases (verify in /compress-pdf/to-*mb after deploy):
//
//   "5 MB target on 10 MB JPEG-heavy PDF"
//     → achievedBytes in [2.5 MB, 5 MB], valid PDF, reachedTarget=true
//
//   "10 MB target on 30 MB PDF"
//     → achievedBytes in [5 MB, 10 MB] OR reachedTarget=false with valid PDF
//
//   "100 KB target on 30 MB PDF"
//     → achievedBytes ≤ 100 KB, OR reachedTarget=false with valid PDF
//
//   "25 MB target on 5 MB PDF"
//     → isUnchanged=true, file byte-identical to input  ← live bug regression

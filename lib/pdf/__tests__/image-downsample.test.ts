// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { downsampleFlateImage, DownsampleOptions } from '../image-downsample';
import * as pako from 'pako';

function makeRgbBitmap(width: number, height: number): Uint8Array {
  // High-entropy pseudo-random bytes so Flate cannot compress the source
  // meaningfully. This lets the downsample assertion compare against a
  // realistic pre-downsample byte count.
  const pixels = new Uint8Array(width * height * 3);
  let state = 0x12345678;
  for (let i = 0; i < pixels.length; i++) {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    pixels[i] = state & 0xff;
  }
  return pixels;
}

describe('downsampleFlateImage', () => {
  it('reduces byte count when downsampling above the DPI ceiling', async () => {
    const width = 600;
    const height = 600;
    const raw = makeRgbBitmap(width, height);
    const compressed = pako.deflate(raw);
    const opts: DownsampleOptions = {
      sourceWidth: width,
      sourceHeight: height,
      sourceDpi: 300,
      targetDpi: 150,
      colorSpace: 'DeviceRGB',
      bitsPerComponent: 8,
      jpegQuality: 0.7,
    };
    const result = await downsampleFlateImage(compressed, opts);
    expect(result.bytes.byteLength).toBeLessThan(compressed.byteLength);
    expect(result.width).toBe(300);
    expect(result.height).toBe(300);
    expect(['DCTDecode', 'FlateDecode']).toContain(result.filter);
  });

  it('returns the original bytes when source is already below the DPI ceiling', async () => {
    const raw = makeRgbBitmap(100, 100);
    const compressed = pako.deflate(raw);
    const result = await downsampleFlateImage(compressed, {
      sourceWidth: 100,
      sourceHeight: 100,
      sourceDpi: 72,
      targetDpi: 150,
      colorSpace: 'DeviceRGB',
      bitsPerComponent: 8,
      jpegQuality: 0.7,
    });
    expect(result.bytes).toBe(compressed);
    expect(result.filter).toBe('FlateDecode');
  });
});

describe('downsampleFlateImage — flateLevel option', () => {
  it('re-encodes at level 9 when source DPI ≤ target DPI and flateLevel is set', async () => {
    // 100x100 DeviceGray, 8-bit — 10 000 raw bytes, highly compressible (all zeros).
    const raw = new Uint8Array(100 * 100);
    const level6 = pako.deflate(raw, { level: 6 });

    const result = await downsampleFlateImage(level6, {
      sourceWidth: 100,
      sourceHeight: 100,
      sourceDpi: 100,  // <= targetDpi means "keep Flate branch"
      targetDpi: 150,
      colorSpace: 'DeviceGray',
      bitsPerComponent: 8,
      jpegQuality: 0.6,
      flateLevel: 9,
    });

    expect(result.filter).toBe('FlateDecode');
    // Level 9 must be ≤ level 6 for repetitive data.
    expect(result.bytes.byteLength).toBeLessThanOrEqual(level6.byteLength);
  });

  it('leaves bytes unchanged when flateLevel is omitted', async () => {
    const raw = new Uint8Array(100 * 100);
    const level6 = pako.deflate(raw, { level: 6 });

    const result = await downsampleFlateImage(level6, {
      sourceWidth: 100,
      sourceHeight: 100,
      sourceDpi: 100,
      targetDpi: 150,
      colorSpace: 'DeviceGray',
      bitsPerComponent: 8,
      jpegQuality: 0.6,
    });

    expect(result.filter).toBe('FlateDecode');
    expect(result.bytes).toBe(level6); // same reference — untouched
  });
});

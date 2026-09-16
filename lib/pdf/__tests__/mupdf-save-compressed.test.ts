import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { saveCompressed } from '../../converters/mupdf-client';

describe('saveCompressed', () => {
  it.skipIf(typeof Worker === 'undefined')('returns bytes ≤ input for a real fixture', async () => {
    const input = readFileSync(resolve('fixtures/pdf-keep-text/text-with-png.pdf'));
    const out = await saveCompressed(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
    expect(out.byteLength).toBeLessThanOrEqual(input.byteLength);
    // Sanity: still a PDF
    const header = new TextDecoder().decode(new Uint8Array(out).slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});

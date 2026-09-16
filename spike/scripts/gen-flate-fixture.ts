/**
 * Generate a fixture PDF containing a real Flate/DeviceRGB PNG image XObject.
 *
 * Usage:
 *   npx tsx spike/scripts/gen-flate-fixture.ts
 *
 * Emits:
 *   fixtures/pdf-keep-text/text-with-png.pdf
 *
 * The PDF contains a page of text plus a large embedded PNG. We create the PNG
 * bytes with pngjs (no runtime dep required — we build the minimal PNG chunks
 * by hand) so the script has zero extra dependencies.
 */
import { PDFDocument, StandardFonts, PDFRawStream, PDFName } from 'pdf-lib';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

// Build a minimal RGB PNG (no alpha) so pdf-lib.embedPng produces a single
// FlateDecode / DeviceRGB image XObject (no SMask).
function makeRgbPng(width: number, height: number): Uint8Array {
  // Fill with a smooth gradient so re-encoding is well-defined and JPEGs
  // can compress it meaningfully.
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const o = rowStart + 1 + x * 3;
      raw[o] = (x * 255) / width & 0xff;      // R
      raw[o + 1] = (y * 255) / height & 0xff; // G
      raw[o + 2] = ((x + y) * 127) / (width + height) & 0xff; // B
    }
  }
  const idat = zlib.deflateSync(raw);

  const chunks: Buffer[] = [];
  // signature
  chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  chunks.push(makeChunk('IHDR', ihdr));
  chunks.push(makeChunk('IDAT', idat));
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));
  return new Uint8Array(Buffer.concat(chunks));
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

async function main() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const png = makeRgbPng(1600, 1200); // large enough to matter
  const image = await pdf.embedPng(png);

  const page = pdf.addPage([612, 792]);
  page.drawText('Text with embedded PNG (Flate/DeviceRGB) fixture.', {
    x: 50, y: 750, size: 12, font,
  });
  for (let i = 0; i < 20; i++) {
    page.drawText(
      `Line ${i}: keep-text pass must downsample the PNG below.`,
      { x: 50, y: 730 - i * 14, size: 10, font }
    );
  }
  page.drawImage(image, { x: 50, y: 100, width: 512, height: 384 });

  const bytes = await pdf.save({ useObjectStreams: true });

  const outDir = path.join(process.cwd(), 'fixtures', 'pdf-keep-text');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'text-with-png.pdf');
  fs.writeFileSync(outPath, bytes);

  // Verify: enumerate objects and print filter/subtype/colorspace of every
  // image XObject so we can confirm shape before writing tests.
  const loaded = await PDFDocument.load(bytes);
  for (const [ref, obj] of loaded.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const subtype = obj.dict.get(PDFName.of('Subtype'));
    if (subtype?.toString() !== '/Image') continue;
    const filter = obj.dict.get(PDFName.of('Filter'));
    const cs = obj.dict.get(PDFName.of('ColorSpace'));
    const w = obj.dict.get(PDFName.of('Width'));
    const h = obj.dict.get(PDFName.of('Height'));
    const bpc = obj.dict.get(PDFName.of('BitsPerComponent'));
    // eslint-disable-next-line no-console
    console.log('image xobject', {
      ref: ref.toString(),
      filter: filter?.toString(),
      colorSpace: cs?.toString(),
      width: w?.toString(),
      height: h?.toString(),
      bitsPerComponent: bpc?.toString(),
      streamBytes: obj.contents.byteLength,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`wrote ${outPath} (${bytes.byteLength} bytes)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

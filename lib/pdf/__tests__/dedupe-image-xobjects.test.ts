import { describe, it, expect } from 'vitest';
import { PDFDocument, PDFRawStream, PDFName, PDFNumber, PDFDict } from 'pdf-lib';
import { dedupeImageXObjects } from '../dedupe-image-xobjects';

/** Build an image XObject dict with the same shape our code writes. */
function buildImageDict(context: any, len: number) {
  const dict = PDFDict.withContext(context);
  dict.set(PDFName.of('Type'), PDFName.of('XObject'));
  dict.set(PDFName.of('Subtype'), PDFName.of('Image'));
  dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
  dict.set(PDFName.of('Width'), PDFNumber.of(10));
  dict.set(PDFName.of('Height'), PDFNumber.of(10));
  dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
  dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
  dict.set(PDFName.of('Length'), PDFNumber.of(len));
  return dict;
}

describe('dedupeImageXObjects', () => {
  it('collapses 2 duplicate image streams into 1 and reports 1 collapsed', async () => {
    const doc = await PDFDocument.create();
    const ctx = doc.context;
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 0x00, 0x01, 0x02, 0x03]);

    const refA = ctx.register(PDFRawStream.of(buildImageDict(ctx, bytes.length), bytes));
    const refB = ctx.register(PDFRawStream.of(buildImageDict(ctx, bytes.length), bytes));

    // Page 1 uses refA; page 2 uses refB.
    const p1 = doc.addPage();
    const p2 = doc.addPage();
    const res1 = PDFDict.withContext(ctx);
    res1.set(PDFName.of('Im0'), refA);
    p1.node.set(PDFName.of('Resources'), PDFDict.withContext(ctx));
    (p1.node.get(PDFName.of('Resources')) as PDFDict).set(PDFName.of('XObject'), res1);

    const res2 = PDFDict.withContext(ctx);
    res2.set(PDFName.of('Im0'), refB);
    p2.node.set(PDFName.of('Resources'), PDFDict.withContext(ctx));
    (p2.node.get(PDFName.of('Resources')) as PDFDict).set(PDFName.of('XObject'), res2);

    const { collapsed } = await dedupeImageXObjects(doc);

    expect(collapsed).toBe(1);
    const p2Xo = (p2.node.get(PDFName.of('Resources')) as PDFDict).get(
      PDFName.of('XObject'),
    ) as PDFDict;
    expect(p2Xo.get(PDFName.of('Im0'))).toBe(refA);
  });

  it('reports 0 collapsed when all images are unique', async () => {
    const doc = await PDFDocument.create();
    const ctx = doc.context;
    ctx.register(PDFRawStream.of(buildImageDict(ctx, 4), new Uint8Array([1, 2, 3, 4])));
    ctx.register(PDFRawStream.of(buildImageDict(ctx, 4), new Uint8Array([5, 6, 7, 8])));

    const { collapsed } = await dedupeImageXObjects(doc);
    expect(collapsed).toBe(0);
  });

  it('does not collapse duplicates whose dicts differ (e.g., SMask on one)', async () => {
    const doc = await PDFDocument.create();
    const ctx = doc.context;
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const dictA = buildImageDict(ctx, bytes.length);
    const dictB = buildImageDict(ctx, bytes.length);
    dictB.set(PDFName.of('Interpolate'), PDFName.of('true')); // wrong type, but forces a dict diff

    ctx.register(PDFRawStream.of(dictA, bytes));
    ctx.register(PDFRawStream.of(dictB, bytes));

    const { collapsed } = await dedupeImageXObjects(doc);
    expect(collapsed).toBe(0);
  });
});

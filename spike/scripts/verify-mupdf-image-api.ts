// mupdf image-enumeration API verification
// Package version: mupdf ^1.27.0 (see package.json)
// Type source: node_modules/mupdf/dist/mupdf.d.ts
//
// Findings:
// - No PDFPage.getImages() method exists in the shipped typings.
// - PDFPage exposes getObject(): PDFObject (line 561), which returns the raw
//   page dict — walking it manually would require descending into /Resources
//   /XObject and content streams. NOT the recommended path.
// - The supported path is the StructuredText walker:
//     Page.toStructuredText(options?: string): StructuredText   (line 443)
//     StructuredText.walk(walker: StructuredTextWalker): void   (line 255)
//     interface StructuredTextWalker {
//       onImageBlock?(bbox: Rect, transform: Matrix, image: Image): void;
//       ...
//     }                                                          (lines 239-247)
//   This yields, per image on the page:
//     - bbox: Rect — the rendered rectangle on the page in points
//     - transform: Matrix — the CTM applied to the 1x1 image unit square
//     - image: Image — with getWidth(), getHeight(), getXResolution(),
//       getYResolution(), getColorSpace(), toPixmap() (lines 124-140)
// - Effective DPI per image can be computed as:
//     dpiX = image.getWidth()  / (bbox.width  / 72)
//     dpiY = image.getHeight() / (bbox.height / 72)
//   (bbox is in points; 72 pt = 1 inch.)
// - Note: StructuredText.walk enumerates images encountered while rendering the
//   page. An image XObject referenced multiple times will be reported multiple
//   times, once per placement — which is exactly what we want for effective-DPI
//   calculation. The same underlying Image handle may repeat; we can dedupe by
//   the fz_image pointer if needed (Image extends Userdata<"fz_image">).
// - Device.onImageBlock is also present on the low-level Device interface
//   (line 240), but StructuredText.walk is the higher-level idiomatic API and
//   is already used in the codebase (lib/converters/mupdf.worker.ts calls
//   page.toStructuredText(...)).
//
// Decision:
// - Feature #1 (per-image DPI) is: SUPPORTED
//   Task 6 will use page.toStructuredText(...).walk({ onImageBlock }) to gather
//   per-image bbox + image dims, compute effective DPI, and skip/adjust the
//   downsample factor accordingly.

import * as mupdf from 'mupdf';

// Optional runtime probe. Not run as a test — scratchpad only. Kept minimal so
// it type-checks against the shipped .d.ts without needing a real PDF fixture.
async function probe(pdfBytes: Uint8Array) {
  const doc = mupdf.Document.openDocument(pdfBytes, 'application/pdf');
  const pageCount = doc.countPages();
  const results: Array<{
    page: number;
    bbox: [number, number, number, number];
    pxW: number;
    pxH: number;
    dpiX: number;
    dpiY: number;
  }> = [];

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const stext = page.toStructuredText('preserve-images');
    stext.walk({
      onImageBlock(bbox, _transform, image) {
        const wPts = bbox.x1 - bbox.x0;
        const hPts = bbox.y1 - bbox.y0;
        const pxW = image.getWidth();
        const pxH = image.getHeight();
        const dpiX = wPts > 0 ? pxW / (wPts / 72) : 0;
        const dpiY = hPts > 0 ? pxH / (hPts / 72) : 0;
        results.push({
          page: i,
          bbox: [bbox.x0, bbox.y0, bbox.x1, bbox.y1],
          pxW,
          pxH,
          dpiX,
          dpiY,
        });
      },
    });
  }

  return results;
}

export { probe };

/**
 * Per-page bitonal/grayscale/color classifier prototype.
 *
 * Usage: npx tsx spike/scripts/classify-pages.ts <path-to-pdf>
 *
 * Rasterizes each page at 150 DPI with pdfjs-dist (Node canvas), samples
 * ~5000 pixels evenly, and classifies each page:
 *   - bitonal: >99% of samples near-black (all channels <=16) or near-white (>=239)
 *   - grayscale: R~=G~=B within +-8 for >99% of samples
 *   - color: otherwise
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createCanvas } = require("canvas");

// pdfjs-dist legacy build works in Node
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjs = require("pdfjs-dist/legacy/build/pdf.mjs");

type Verdict = "bitonal" | "grayscale" | "color";

interface NodeCanvasFactory {
  create(width: number, height: number): {
    canvas: ReturnType<typeof createCanvas>;
    context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>;
  };
  reset(
    canvasAndContext: { canvas: ReturnType<typeof createCanvas>; context: unknown },
    width: number,
    height: number,
  ): void;
  destroy(canvasAndContext: { canvas: unknown; context: unknown }): void;
}

const canvasFactory: NodeCanvasFactory = {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  },
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },
  destroy(canvasAndContext) {
    // @ts-expect-error node-canvas cleanup
    canvasAndContext.canvas.width = 0;
    // @ts-expect-error node-canvas cleanup
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

function classify(pixels: Buffer, width: number, height: number, sampleCount = 5000): Verdict {
  const totalPx = width * height;
  const stride = Math.max(1, Math.floor(totalPx / sampleCount));
  let taken = 0;
  let bitonalHits = 0;
  let grayscaleHits = 0;

  for (let i = 0; i < totalPx && taken < sampleCount; i += stride) {
    const off = i * 4;
    const r = pixels[off];
    const g = pixels[off + 1];
    const b = pixels[off + 2];
    // Alpha ignored.
    const nearBlack = r <= 16 && g <= 16 && b <= 16;
    const nearWhite = r >= 239 && g >= 239 && b >= 239;
    if (nearBlack || nearWhite) bitonalHits++;
    const maxCh = Math.max(r, g, b);
    const minCh = Math.min(r, g, b);
    if (maxCh - minCh <= 8) grayscaleHits++;
    taken++;
  }

  const bitonalRatio = bitonalHits / taken;
  const grayRatio = grayscaleHits / taken;
  if (bitonalRatio > 0.99) return "bitonal";
  if (grayRatio > 0.99) return "grayscale";
  return "color";
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: tsx spike/scripts/classify-pages.ts <pdf-path>");
    process.exit(1);
  }

  const data = new Uint8Array(readFileSync(pdfPath));
  const t0 = Date.now();
  const loadingTask = pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
    canvasFactory,
  });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  // 150 DPI relative to PDF default 72 DPI => scale ~2.083
  const scale = 150 / 72;
  const counts: Record<Verdict, number> = { bitonal: 0, grayscale: 0, color: 0 };
  const perPageMs: number[] = [];
  const verdicts: Verdict[] = [];

  for (let p = 1; p <= numPages; p++) {
    const pageStart = Date.now();
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const { canvas, context } = canvasFactory.create(width, height);
    // white background to avoid alpha-only transparent areas confusing classifier
    // (pdfjs paints on transparent by default)
    // @ts-expect-error node-canvas context
    context.fillStyle = "#ffffff";
    // @ts-expect-error node-canvas context
    context.fillRect(0, 0, width, height);
    const renderTask = page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
      canvas,
    });
    await renderTask.promise;
    // @ts-expect-error node-canvas
    const imgData = context.getImageData(0, 0, width, height);
    const verdict = classify(Buffer.from(imgData.data.buffer), width, height);
    verdicts.push(verdict);
    counts[verdict]++;
    const ms = Date.now() - pageStart;
    perPageMs.push(ms);
    canvasFactory.destroy({ canvas, context });
    page.cleanup();
    console.log(`page ${p}/${numPages}: ${verdict} (${ms} ms, ${width}x${height})`);
  }

  const totalMs = Date.now() - t0;
  const avgMs = perPageMs.reduce((a, b) => a + b, 0) / perPageMs.length;

  console.log("\n=== SUMMARY ===");
  console.log(`file: ${basename(pdfPath)}`);
  console.log(`pages: ${numPages}`);
  console.log(`bitonal: ${counts.bitonal}, grayscale: ${counts.grayscale}, color: ${counts.color}`);
  console.log(`avg ms/page: ${avgMs.toFixed(1)}`);
  console.log(`total ms: ${totalMs}`);
  console.log(`verdicts: ${verdicts.join(",")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

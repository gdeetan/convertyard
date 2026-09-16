# Compress-PDF P0 Keep-Text — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a target-size compress-PDF flow that never silently rasterizes text-heavy documents, gates rasterize behind explicit user consent when the keep-text pass can't hit the target, and removes three integrity gaps (linearize, font subsetting, per-image-type quality claims) that are advertised but not implemented.

**Architecture:** Split `compressPdfToTargetSize` into two functions — `compressPdfKeepText` (structural cleanup + real image downsample for JPEG and Flate/PNG, never rasterizes) and `rasterizeToTargetSize` (existing 200→72 DPI passes, only invoked after user opts in via `UnachievableTargetCard`). Add a new pure module `lib/pdf/image-downsample.ts` for Flate/PNG decode-downsample-re-encode. Strip three product claims from the comparison table and remove the linearize + font-subset UI controls that don't do what they say.

**Tech Stack:** Next.js App Router + TypeScript, Vitest, pdf-lib 1.17, mupdf 1.27, existing `mupdf-client` wrapper, `pako` for Flate decode (verify install in Task 1), OffscreenCanvas for pixel downsample.

**Spec:** `docs/superpowers/specs/2026-09-16-compress-pdf-p0-keep-text-design.md`
**Branch:** `feature/compress-pdf-p0-keep-text` (already created)

---

## Task 1: Add Flate/PNG image downsample module

**Files:**
- Create: `lib/pdf/image-downsample.ts`
- Test: `lib/pdf/__tests__/image-downsample.test.ts`

- [ ] **Step 1: Verify or install pako**

```bash
node -e "require.resolve('pako')" 2>&1 | tail -1
```

If it errors with "Cannot find module 'pako'", install:

```bash
npm install pako
npm install -D @types/pako
```

- [ ] **Step 2: Write the failing test**

Create `lib/pdf/__tests__/image-downsample.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { downsampleFlateImage, DownsampleOptions } from '../image-downsample';
import pako from 'pako';

function makeRgbBitmap(width: number, height: number): Uint8Array {
  const pixels = new Uint8Array(width * height * 3);
  for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 7) & 0xff;
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
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run lib/pdf/__tests__/image-downsample.test.ts
```

Expected: FAIL with "Cannot find module '../image-downsample'".

- [ ] **Step 4: Implement image-downsample.ts**

Create `lib/pdf/image-downsample.ts`:

```typescript
import pako from 'pako';

export interface DownsampleOptions {
  sourceWidth: number;
  sourceHeight: number;
  sourceDpi: number;
  targetDpi: number;
  colorSpace: 'DeviceRGB' | 'DeviceGray';
  bitsPerComponent: number;
  jpegQuality: number;
}

export interface DownsampleResult {
  bytes: Uint8Array;
  width: number;
  height: number;
  filter: 'DCTDecode' | 'FlateDecode';
}

export async function downsampleFlateImage(
  compressed: Uint8Array,
  opts: DownsampleOptions
): Promise<DownsampleResult> {
  if (opts.sourceDpi <= opts.targetDpi) {
    return {
      bytes: compressed,
      width: opts.sourceWidth,
      height: opts.sourceHeight,
      filter: 'FlateDecode',
    };
  }

  const scale = opts.targetDpi / opts.sourceDpi;
  const newWidth = Math.max(1, Math.round(opts.sourceWidth * scale));
  const newHeight = Math.max(1, Math.round(opts.sourceHeight * scale));

  const raw = pako.inflate(compressed);
  const rgba = expandToRgba(raw, opts.sourceWidth, opts.sourceHeight, opts.colorSpace, opts.bitsPerComponent);

  const srcCanvas = new OffscreenCanvas(opts.sourceWidth, opts.sourceHeight);
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('OffscreenCanvas 2d context unavailable');
  srcCtx.putImageData(new ImageData(rgba, opts.sourceWidth, opts.sourceHeight), 0, 0);

  const dstCanvas = new OffscreenCanvas(newWidth, newHeight);
  const dstCtx = dstCanvas.getContext('2d');
  if (!dstCtx) throw new Error('OffscreenCanvas 2d context unavailable');
  dstCtx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);

  const blob = await dstCanvas.convertToBlob({ type: 'image/jpeg', quality: opts.jpegQuality });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { bytes, width: newWidth, height: newHeight, filter: 'DCTDecode' };
}

function expandToRgba(
  raw: Uint8Array,
  width: number,
  height: number,
  colorSpace: 'DeviceRGB' | 'DeviceGray',
  bitsPerComponent: number
): Uint8ClampedArray {
  if (bitsPerComponent !== 8) {
    throw new Error(`Unsupported bitsPerComponent: ${bitsPerComponent}`);
  }
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (colorSpace === 'DeviceRGB') {
    for (let i = 0, j = 0; i < raw.length; i += 3, j += 4) {
      rgba[j] = raw[i];
      rgba[j + 1] = raw[i + 1];
      rgba[j + 2] = raw[i + 2];
      rgba[j + 3] = 255;
    }
  } else {
    for (let i = 0, j = 0; i < raw.length; i++, j += 4) {
      rgba[j] = raw[i];
      rgba[j + 1] = raw[i];
      rgba[j + 2] = raw[i];
      rgba[j + 3] = 255;
    }
  }
  return rgba;
}
```

- [ ] **Step 5: Run tests until pass**

```bash
npx vitest run lib/pdf/__tests__/image-downsample.test.ts
```

Expected: 2/2 pass. If OffscreenCanvas is missing in the Vitest env, add the environment hint to the top of the test file:

```typescript
// @vitest-environment happy-dom
```

Rerun. If happy-dom lacks OffscreenCanvas, add `@vitest-environment jsdom` and polyfill via `import 'canvas'` at the top — verify by rerunning.

- [ ] **Step 6: Commit**

```bash
git add lib/pdf/image-downsample.ts lib/pdf/__tests__/image-downsample.test.ts package.json package-lock.json
git commit -m "feat(compress-pdf): add Flate/PNG image downsample module"
```

---

## Task 2: Introduce TargetSizeResult type and keep-text pipeline shell

**Files:**
- Modify: `lib/converters/pdf.ts:350-500` (`compressPdfToTargetSize` and its callers)
- Test: `lib/converters/__tests__/pdf-keep-text.test.ts`

- [ ] **Step 1: Add TargetSizeResult type + `compressPdfKeepText` shell (no image work yet)**

At the top of `lib/converters/pdf.ts` (near other type exports), add:

```typescript
export type TargetSizeResult =
  | { ok: true; blob: Blob; bytes: number; passesRun: string[] }
  | {
      ok: false;
      reason: 'unachievable-keep-text';
      bestBlob: Blob;
      bestBytes: number;
      targetBytes: number;
      passesRun: string[];
    };
```

Add a new exported function `compressPdfKeepText` next to `compressPdfToTargetSize` (line ~350). Initial version runs only structural cleanup and JPEG re-encode (existing steps 1–2), then returns `ok: true` or `ok: false` — no rasterize:

```typescript
export async function compressPdfKeepText(
  input: File,
  targetBytes: number,
  onProgress?: (pct: number) => void
): Promise<TargetSizeResult> {
  const passesRun: string[] = [];

  const structural = await compressStructural(input, { /* existing high preset */ });
  passesRun.push('structural-cleanup');
  onProgress?.(30);
  if (structural.size <= targetBytes) {
    return { ok: true, blob: structural, bytes: structural.size, passesRun };
  }

  const jpegPass = await recompressImages(structural, { quality: 60 });
  passesRun.push('jpeg-recompress');
  onProgress?.(70);
  if (jpegPass.size <= targetBytes) {
    return { ok: true, blob: jpegPass, bytes: jpegPass.size, passesRun };
  }

  onProgress?.(100);
  return {
    ok: false,
    reason: 'unachievable-keep-text',
    bestBlob: jpegPass,
    bestBytes: jpegPass.size,
    targetBytes,
    passesRun,
  };
}
```

(Adjust the call signatures of `compressStructural` and `recompressImages` to match their actual signatures — check `pdf.ts:46` and `pdf.ts:166`.)

- [ ] **Step 2: Write failing tests**

Create `lib/converters/__tests__/pdf-keep-text.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { compressPdfKeepText } from '../pdf';

function loadFixture(path: string): File {
  const bytes = readFileSync(path);
  return new File([bytes], path.split('/').pop() ?? 'fixture.pdf', { type: 'application/pdf' });
}

describe('compressPdfKeepText', () => {
  it('returns ok=true when the target is easily achievable', async () => {
    const file = loadFixture('fixtures/pdf-scan-codec-spike/public-bitonal-certificate.pdf');
    const result = await compressPdfKeepText(file, 5_000_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bytes).toBeLessThanOrEqual(5_000_000);
      expect(result.passesRun.length).toBeGreaterThan(0);
    }
  });

  it('returns ok=false with best bytes when the target is unreachable without rasterize', async () => {
    const file = loadFixture('fixtures/pdf-scan-codec-spike/public-bitonal-certificate.pdf');
    const result = await compressPdfKeepText(file, 1_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unachievable-keep-text');
      expect(result.bestBytes).toBeGreaterThan(1_000);
      expect(result.targetBytes).toBe(1_000);
    }
  });

  it('never rasterizes — output PDF still contains text operators', async () => {
    const file = loadFixture('fixtures/pdf-scan-codec-spike/public-bitonal-certificate.pdf');
    const result = await compressPdfKeepText(file, 1_000);
    const blob = result.ok ? result.blob : result.bestBlob;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder('latin1').decode(bytes);
    const hasTextOp = /\bTj\b|\bTJ\b|\bT\*\b|\bTL\b/.test(text);
    expect(hasTextOp).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they compile and fail meaningfully**

```bash
npx vitest run lib/converters/__tests__/pdf-keep-text.test.ts
```

Expected: tests execute (compressPdfKeepText is now exported); "never rasterizes" test may already pass since the shell function doesn't rasterize. Skip forward if all pass.

- [ ] **Step 4: Extract existing rasterize path into `rasterizeToTargetSize`**

Move the existing rasterize escalation (`pdf.ts:383-391` steps 3–7) into a new exported function:

```typescript
export async function rasterizeToTargetSize(
  input: File,
  targetBytes: number,
  onProgress?: (pct: number) => void
): Promise<{ file: File; meta: CompressionMeta }> {
  // Move the rasterize passes (200 DPI q80, 150 DPI q75, 100 DPI q65, 72 DPI q40, grayscale 72 DPI q35) from compressPdfToTargetSize here.
  // Return the same shape compressPdfToTargetSize returned for these steps.
}
```

Have the old `compressPdfToTargetSize` internally call `compressPdfKeepText` first, and if unachievable, call `rasterizeToTargetSize`. Old function still exists but is now a thin adapter — will be deleted in Task 5.

- [ ] **Step 5: Run all pdf tests**

```bash
npx vitest run lib/converters lib/pdf
```

Expected: all pass. If any regression appears in `analyzer.test.ts` or `savings-estimator.test.ts`, DO NOT change those tests — fix the extraction until they pass.

- [ ] **Step 6: Commit**

```bash
git add lib/converters/pdf.ts lib/converters/__tests__/pdf-keep-text.test.ts
git commit -m "feat(compress-pdf): split target-size into keep-text + rasterize"
```

---

## Task 3: Wire Flate/PNG downsample into `compressPdfKeepText`

**Files:**
- Modify: `lib/converters/pdf.ts` (`recompressImages` and/or new helper)
- Test: extend `lib/converters/__tests__/pdf-keep-text.test.ts`

- [ ] **Step 1: Write failing test**

Add to `pdf-keep-text.test.ts`:

```typescript
it('downsamples Flate/PNG images, not just JPEG', async () => {
  // Use a fixture that is text-heavy with an embedded PNG (Flate/DeviceRGB).
  // If none exists in fixtures/, add fixtures/pdf-keep-text/text-with-png.pdf.
  const file = loadFixture('fixtures/pdf-keep-text/text-with-png.pdf');
  const before = file.size;
  const result = await compressPdfKeepText(file, Math.floor(before / 2));
  const outBlob = result.ok ? result.blob : result.bestBlob;
  expect(outBlob.size).toBeLessThan(before);
});
```

If `fixtures/pdf-keep-text/text-with-png.pdf` doesn't exist, generate it with a small tsx script in `spike/scripts/gen-flate-fixture.ts` (using pdf-lib to embed a PNG) and commit under `fixtures/pdf-keep-text/`. Run:

```bash
mkdir -p fixtures/pdf-keep-text
npx tsx spike/scripts/gen-flate-fixture.ts
```

The gen script (create it):

```typescript
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { writeFileSync, readFileSync } from 'node:fs';

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  page.drawText('Text-heavy body with an embedded PNG below.', { x: 50, y: 720, font, size: 12 });
  const png = await doc.embedPng(readFileSync('fixtures/pdf-keep-text/sample.png'));
  page.drawImage(png, { x: 50, y: 200, width: 500, height: 500 });
  writeFileSync('fixtures/pdf-keep-text/text-with-png.pdf', await doc.save());
}
main();
```

If `sample.png` doesn't exist, generate a 1200×1200 RGB PNG first (any script or manually copy from a public source; commit only the resulting `text-with-png.pdf` under 5 MB).

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/converters/__tests__/pdf-keep-text.test.ts -t "downsamples Flate"
```

Expected: FAIL (existing `recompressImages` only touches `/DCTDecode`).

- [ ] **Step 3: Extend `recompressImages` to handle Flate/PNG**

In `lib/converters/pdf.ts:166`, after the existing JPEG-only branch, add:

```typescript
import { downsampleFlateImage } from '../pdf/image-downsample';

// Inside the loop over image XObjects, replace the "only JPEG" check with:
const filter = image.Filter; // read from pdf-lib
if (filter === 'DCTDecode') {
  // existing JPEG re-encode path
} else if (filter === 'FlateDecode') {
  const colorSpaceName = image.ColorSpace as 'DeviceRGB' | 'DeviceGray' | string;
  if (colorSpaceName !== 'DeviceRGB' && colorSpaceName !== 'DeviceGray') {
    // Unsupported color space — preserve as-is
    continue;
  }
  const bitsPerComponent = image.BitsPerComponent ?? 8;
  if (bitsPerComponent !== 8) continue;

  const sourceDpi = estimateImageDpi(image, page); // reuse the analyzer helper if available; else assume 300 as a conservative default
  const downsampled = await downsampleFlateImage(image.RawStream, {
    sourceWidth: image.Width,
    sourceHeight: image.Height,
    sourceDpi,
    targetDpi: options.targetDpi ?? 150,
    colorSpace: colorSpaceName,
    bitsPerComponent,
    jpegQuality: (options.quality ?? 60) / 100,
  });
  // Replace the XObject stream with downsampled.bytes and set filter to downsampled.filter
  replaceImageXObject(page, imageRef, downsampled);
} else {
  // /JPXDecode /JBIG2Decode /CCITTFaxDecode — preserve, add to preservedImages diagnostic
}
```

The exact pdf-lib API for reading and rewriting image XObject streams may require using the low-level `PDFRawStream` API — check pdf-lib source or use `pdf.context.lookup(imageRef)` to get the stream dictionary. If pdf-lib does not expose stream replacement, use `PDFRawStream.of(dict, bytes)` and `pdf.context.assign(imageRef, newStream)`.

- [ ] **Step 4: Run tests**

```bash
npx vitest run lib/converters lib/pdf
```

Expected: all pass, including the new "downsamples Flate/PNG" test.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/pdf.ts lib/converters/__tests__/pdf-keep-text.test.ts fixtures/pdf-keep-text spike/scripts/gen-flate-fixture.ts
git commit -m "feat(compress-pdf): downsample Flate/PNG images in keep-text pass"
```

---

## Task 4: UnachievableTargetCard component

**Files:**
- Create: `components/pdf/UnachievableTargetCard.tsx`
- Test: `components/pdf/__tests__/UnachievableTargetCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `components/pdf/__tests__/UnachievableTargetCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnachievableTargetCard } from '../UnachievableTargetCard';

describe('UnachievableTargetCard', () => {
  it('shows best-possible size and target', () => {
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={() => {}} onRasterize={() => {}} />);
    expect(screen.getByText(/720 KB/)).toBeDefined();
    expect(screen.getByText(/500 KB/)).toBeDefined();
  });

  it('calls onKeep when the Keep button is clicked', () => {
    const onKeep = vi.fn();
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={onKeep} onRasterize={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /keep as/i }));
    expect(onKeep).toHaveBeenCalledOnce();
  });

  it('calls onRasterize when the Rasterize button is clicked', () => {
    const onRasterize = vi.fn();
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={() => {}} onRasterize={onRasterize} />);
    fireEvent.click(screen.getByRole('button', { name: /rasterize anyway/i }));
    expect(onRasterize).toHaveBeenCalledOnce();
  });

  it('warns that rasterize breaks searchable text', () => {
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={() => {}} onRasterize={() => {}} />);
    expect(screen.getByText(/breaks searchable text/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/pdf/__tests__/UnachievableTargetCard.test.tsx
```

Expected: FAIL with "Cannot find module '../UnachievableTargetCard'".

- [ ] **Step 3: Implement the component**

Create `components/pdf/UnachievableTargetCard.tsx`:

```typescript
'use client';

interface UnachievableTargetCardProps {
  bestBytes: number;
  targetBytes: number;
  onKeep: () => void;
  onRasterize: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
}

export function UnachievableTargetCard({ bestBytes, targetBytes, onKeep, onRasterize }: UnachievableTargetCardProps) {
  const best = formatBytes(bestBytes);
  const target = formatBytes(targetBytes);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 my-4">
      <p className="text-sm text-amber-900 font-medium">
        Best possible: {best}. Target: {target} not met without rasterizing.
      </p>
      <p className="text-sm text-amber-800 mt-1">
        Rasterizing breaks searchable text — the PDF becomes a picture.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onKeep}
          className="px-3 py-1.5 text-sm rounded border border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
        >
          Keep as {best}
        </button>
        <button
          type="button"
          onClick={onRasterize}
          className="px-3 py-1.5 text-sm rounded bg-amber-600 text-white hover:bg-amber-700"
        >
          Rasterize anyway
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests until pass**

```bash
npx vitest run components/pdf/__tests__/UnachievableTargetCard.test.tsx
```

Expected: 4/4 pass. If `@testing-library/react` isn't installed, install it as a devDep:

```bash
npm install -D @testing-library/react @testing-library/dom happy-dom
```

Add `// @vitest-environment happy-dom` to the top of the test file if the default env doesn't have `document`.

- [ ] **Step 5: Commit**

```bash
git add components/pdf/UnachievableTargetCard.tsx components/pdf/__tests__/UnachievableTargetCard.test.tsx package.json package-lock.json
git commit -m "feat(compress-pdf): add UnachievableTargetCard component"
```

---

## Task 5: Wire the gate into the compress-pdf convert flow

**Files:**
- Modify: `components/tool-shell/tool-shell.tsx` (only if a result-hook injection point is needed) OR
- Modify: `app/(tools)/compress-pdf/page.tsx` (preferred — keep the gate scoped to this tool)
- Modify: `lib/converters/pdf.ts` — delete the deprecated `compressPdfToTargetSize` adapter

- [ ] **Step 1: Verify the wire-in point**

Read `app/(tools)/compress-pdf/page.tsx` and identify how the tool passes its converter to `ToolShell`. If ToolShell accepts a `convertFn`, the gate lives in a wrapper on the page. If ToolShell owns dispatch directly (per the code map, it does), we need to introduce a per-file "post-convert continuation" for this tool.

The simplest wire-in that doesn't touch ToolShell: on the compress-pdf page, replace the passed `convertFn` with a wrapper that, when a file returns `ok: false`, returns the `bestBlob` immediately AND stores the unachievable state in a Zustand slice; the page renders `UnachievableTargetCard` per pending file below the result list, and calling `onRasterize` re-invokes the converter with a `forceRasterize` flag.

Preferred flow (adapted to whatever the page actually exposes):

```typescript
// app/(tools)/compress-pdf/page.tsx
import { useState } from 'react';
import { compressPdfKeepText, rasterizeToTargetSize, TargetSizeResult } from '@/lib/converters/pdf';
import { UnachievableTargetCard } from '@/components/pdf/UnachievableTargetCard';

interface PendingRasterize {
  fileIndex: number;
  input: File;
  bestBytes: number;
  targetBytes: number;
}

// Inside the page component:
const [pending, setPending] = useState<PendingRasterize[]>([]);

const convertFn = async (files: File[], options: ToolOptions, onProgress: (i: number, pct: number) => void) => {
  const results: Array<File | Error> = [];
  const nextPending: PendingRasterize[] = [];
  for (let i = 0; i < files.length; i++) {
    if (options.targetSizeMode) {
      const res: TargetSizeResult = await compressPdfKeepText(files[i], options.targetBytes, (pct) => onProgress(i, pct));
      if (res.ok) {
        results.push(new File([res.blob], files[i].name, { type: 'application/pdf' }));
      } else {
        results.push(new File([res.bestBlob], files[i].name, { type: 'application/pdf' }));
        nextPending.push({ fileIndex: i, input: files[i], bestBytes: res.bestBytes, targetBytes: res.targetBytes });
      }
    } else {
      // existing non-target compress path
    }
  }
  setPending(nextPending);
  return results;
};

const handleRasterize = async (p: PendingRasterize) => {
  const { file, meta } = await rasterizeToTargetSize(p.input, p.targetBytes);
  // dispatch update to ToolShell — replace the entry at p.fileIndex with this file
  setPending((cur) => cur.filter((x) => x.fileIndex !== p.fileIndex));
};

// In JSX, below the ToolShell result list:
{pending.map((p) => (
  <UnachievableTargetCard
    key={p.fileIndex}
    bestBytes={p.bestBytes}
    targetBytes={p.targetBytes}
    onKeep={() => setPending((cur) => cur.filter((x) => x.fileIndex !== p.fileIndex))}
    onRasterize={() => handleRasterize(p)}
  />
))}
```

The exact API for "dispatch update to ToolShell" depends on the shell. If ToolShell exposes an `updateResult(fileIndex, file)` callback via a ref or context, use it. Otherwise, add a new prop `onManualReplace?: (i: number, file: File) => void` to ToolShell in this task and dispatch `SET_RESULT` from inside.

- [ ] **Step 2: Manual smoke on a dev server**

```bash
npm run dev
```

- Navigate to `http://localhost:3000/compress-pdf`.
- Enable target-size mode. Set target 100 KB.
- Drop `fixtures/pdf-scan-codec-spike/public-bitonal-certificate.pdf`.
- Click Convert. Confirm the `UnachievableTargetCard` appears below the result with "Best possible: N KB. Target: 100 KB not met."
- Click "Keep as N KB." Confirm the card disappears and the download button reflects the phase-1 output.
- Reset. Repeat with target 100 KB but this time click "Rasterize anyway." Confirm the download is now ≤ 100 KB.
- Open the "Keep as N KB" download in Preview. Confirm text is still selectable. Open the "Rasterize anyway" download in Preview. Confirm text is NOT selectable (it's a picture).

- [ ] **Step 3: Delete the deprecated adapter**

Once manual smoke passes, delete `compressPdfToTargetSize` from `lib/converters/pdf.ts`. Grep the repo:

```bash
grep -r "compressPdfToTargetSize" --include="*.ts" --include="*.tsx"
```

Update any remaining callers to use `compressPdfKeepText` + `rasterizeToTargetSize` directly, or remove them.

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/\(tools\)/compress-pdf/page.tsx lib/converters/pdf.ts components/tool-shell/tool-shell.tsx
git commit -m "feat(compress-pdf): gate rasterize behind explicit user consent"
```

---

## Task 6: Integrity — strip comparison-table over-claims

**Files:**
- Modify: `components/pdf/CompressorComparisonTable.tsx` (lines 19, 21, 23)

- [ ] **Step 1: Edit CompressorComparisonTable**

Open `components/pdf/CompressorComparisonTable.tsx`. Delete these three entries from the features array (verify line numbers with a fresh read first):

- `{ feature: 'Per-image-type quality', ... }` (was line 19)
- `{ feature: 'Font subsetting', ... }` (was line 21)
- `{ feature: 'Linearize for fast web view', ... }` (was line 23)

- [ ] **Step 2: Verify no other file references these features**

```bash
grep -ri "per-image-type\|font subsetting\|linearize for fast web view\|Fast Web View" --include="*.ts" --include="*.tsx" --include="*.md" app components lib content
```

For each hit:
- If it's marketing copy that claims the feature works, delete or rewrite the sentence.
- If it's an internal comment (e.g., `lib/converters/pdf.ts:148` "linearize is wired but no-op"), leave the comment or update it to reflect current state.

- [ ] **Step 3: Commit**

```bash
git add components/pdf/CompressorComparisonTable.tsx
# Add any copy files touched
git commit -m "fix(compress-pdf): stop advertising linearize, font subsetting, per-image-type quality"
```

---

## Task 7: Integrity — remove Advanced-panel controls for linearize and font-subset

**Files:**
- Modify: `content/tools/compress-pdf.ts:143-149, 151-156, 178-183`
- Modify: any advanced-panel React component that renders these toggles (find via grep for the option `name` values)

- [ ] **Step 1: Delete the three option entries**

In `content/tools/compress-pdf.ts`, delete the entries with `name: 'linearize'`, `name: 'subsetFonts'`, and `name: 'removeUnusedFonts'`. Snip the entries cleanly — do not leave dangling commas.

Wait — the code map says `removeUnusedFonts` "actually removes non-6-char-prefixed fonts." That DOES do real work. Keep `removeUnusedFonts`. Delete only `linearize` and `subsetFonts` (the UI-only one that misled `estimateSavings`).

Revised: delete only `linearize` (lines 178–183) and `subsetFonts` (lines 143–149). Keep `removeUnusedFonts` (lines 151–156).

- [ ] **Step 2: Update `lib/pdf/savings-estimator.ts`**

Because `subsetFonts` is gone, remove any branch in `savings-estimator.ts` that reads `options.subsetFonts`. Update `lib/pdf/__tests__/savings-estimator.test.ts` accordingly — that test at line 36 mentions "fontSubsetting savings is 0 when all fonts are subsetted." If the entire fontSubsetting savings line is being removed, delete that test; if it now depends only on `removeUnusedFonts`, update the test to match.

- [ ] **Step 3: Grep for stray references**

```bash
grep -rn "linearize\|subsetFonts" --include="*.ts" --include="*.tsx" app components lib content
```

Expected: only `removeUnusedFonts` remains as a reference to font handling.

- [ ] **Step 4: Run tests**

```bash
npx vitest run
```

Expected: all pass. If `savings-estimator.test.ts` fails on a removed field, that's the test-update Step 2 flagged — fix it.

- [ ] **Step 5: Commit**

```bash
git add content/tools/compress-pdf.ts lib/pdf/savings-estimator.ts lib/pdf/__tests__/savings-estimator.test.ts
git commit -m "fix(compress-pdf): remove linearize and subsetFonts controls (UI-only, not implemented)"
```

---

## Task 8: Regression pass on size-target landings + full smoke

**Files:**
- Read (no edit): `content/size-targets/compress-pdf-to-*.ts`
- Manual: dev server smoke

- [ ] **Step 1: Enumerate size-target landings**

```bash
ls content/size-targets/compress-pdf-to-*.ts
```

For each landing (100 KB, 200 KB, 500 KB, 1 MB, 2 MB, 5 MB, 10 MB, 25 MB — check actual list), the flow must still produce a file within the named cap when the user opts into rasterize.

- [ ] **Step 2: Manual smoke matrix**

On the running dev server (`npm run dev`), test:

| Fixture | Target | Expected outcome |
|---|---|---|
| Text-only doc <100 KB (make one with pdf-lib) | 500 KB | ok=true, no card, text selectable |
| `fixtures/pdf-keep-text/text-with-png.pdf` | 200 KB | Depends on size; either ok=true or card + rasterize works |
| `fixtures/pdf-scan-codec-spike/public-bitonal-certificate.pdf` | 100 KB | Card shows; "Keep" keeps 500 KB output; "Rasterize" hits 100 KB |
| Any digital-native color PDF ~5 MB | 500 KB | Card shows unless downsample hits target |

Record each outcome. If any regression appears vs the current behavior on `main`, STOP and diagnose before proceeding.

- [ ] **Step 3: Grep for stale claims one final time**

```bash
grep -rin "linearize\|font subsetting\|per-image-type\|Fast Web View" --include="*.ts" --include="*.tsx" --include="*.mdx" --include="*.md" app components lib content
```

Expected: zero user-facing claims remain. Any hits should be either deleted or internal comments only.

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: 100% pass.

- [ ] **Step 5: Commit any smoke-driven fixes**

If Step 2 surfaced small fixes, commit them:

```bash
git add <files>
git commit -m "fix(compress-pdf): address regression from manual smoke"
```

If nothing needs a commit, skip.

---

## Verification checklist (before opening PR to main)

- [ ] `compressPdfKeepText` never invokes any rasterize helper — verified by test in Task 2.
- [ ] `rasterizeToTargetSize` is only called from an explicit user action in the compress-pdf page.
- [ ] `UnachievableTargetCard` renders only in the `ok: false` path — verified by manual smoke.
- [ ] Rasterize output for existing size-target landings unchanged when user opts into rasterize — verified by Task 8 matrix.
- [ ] `CompressorComparisonTable` no longer advertises linearize, font subsetting, or per-image-type quality.
- [ ] Linearize and `subsetFonts` controls removed from Advanced options.
- [ ] `grep -rin "linearize|font subsetting|per-image-type"` returns no user-facing claims.
- [ ] Manual smoke on `public-bitonal-certificate.pdf` with target 100 KB: "Keep" output opens in Preview with text still selectable.
- [ ] Full Vitest suite passes (`npx vitest run`).
- [ ] Bundle size on `/compress-pdf` did not increase beyond +5 KB gz — check with `npm run build` and inspect `.next/` output (or the equivalent bundle report tool this repo uses).

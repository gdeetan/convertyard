# Compress-PDF: Exotic-image fallback for preset mode

**Date:** 2026-09-25
**Status:** Approved for planning
**Owner:** compress-pdf
**Related commits:** 5f58336 (rasterize card in target-size), 7a8c717 (level profiles), 7632abf (one-shot rung selection)

## Problem

Standard preset compression (`Low` / `Medium` / `High`) silently no-ops on scanner-produced MRC PDFs. The image pass (`recompressImagesKeepText`) only handles `/DCTDecode`, `[/FlateDecode /DCTDecode]`, and `/FlateDecode`. PDFs whose image XObjects are all `/JBIG2Decode` or `/JPXDecode` — a common shape for modern scans — get only the structural strip's ~2% reduction and are handed back near-original.

Concrete case: `bwb_KR-223-812.pdf`, 9.69 MB, 228 pages, 684 image XObjects (78% JBIG2 + 22% JPX). Standard `High` shaved 200 KB (~2%). Target-size mode would have surfaced the Rasterize card (commit 5f58336), but preset mode has no equivalent fallback.

## Goal

When preset mode encounters an exotic-image-heavy PDF, transparently take a path that actually compresses:

- Pure scans (no separate text layer) → full-page rasterize at the preset's DPI/quality.
- Hybrid PDFs (real OCR text layer over exotic images) → surgical per-image decode + re-encode, preserving the text layer.

Same user action ("click Compress"), same preset controls, no new UI card. `Aggressive` preset is unchanged; it already rasterizes.

## Non-goals

- CCITT (`/CCITTFaxDecode`) decode support. Out of scope; can be added later using the same surface if usage warrants.
- New UI. This is a transparent pipeline change.
- Target-size mode changes. That flow already handles this via the Rasterize card.
- Progress bar rework.
- Text-layer OCR quality validation. We trust mupdf's XObject stream replacement doesn't disturb content streams (it swaps stream bytes at an existing indirect ref).

## Architecture

New **pre-flight router** at the top of the non-aggressive branch in `compressPDF` (`lib/converters/pdf.ts` around line 1720), before `compressStructural`. Classifies the file once per input, then dispatches:

```
compressPDF (non-aggressive)
  └─ preflightClassify(buffer) → { exoticHeavy, hasTextLayer, xobjectList }
      ├─ !exoticHeavy                     → LANE A: current path (unchanged)
      ├─  exoticHeavy && !hasTextLayer    → LANE B: rasterize (reuses Aggressive path)
      └─  exoticHeavy &&  hasTextLayer    → LANE C: extended keep-text w/ exotic decode
```

Mobile (`isMobile()`): any `exoticHeavy` file → LANE B. LANE C never runs on mobile (transient pixmap memory risk on iOS Safari; mirrors the size-gate pattern from commits f6c415c / 768ff16).

## Components

### `preflightClassify(buffer)` — new, in `lib/converters/pdf.ts`

Signature:

```ts
async function preflightClassify(buffer: ArrayBuffer, fileSize: number): Promise<{
  exoticHeavy: boolean
  hasTextLayer: boolean
  xobjectList: XObjectEntry[]  // pre-enumerated; downstream reuses
}>
```

Behavior:

- Enumerates image XObjects via pdf-lib (same walk as `planImageRecompress`).
- Sums stream bytes by filter kind.
- `exoticHeavy = (jbig2Bytes + jpxBytes) / totalImageBytes > 0.5 && totalImageBytes / fileSize > 0.5`. Both thresholds tunable in one place.
- `hasTextLayer`: single `extractText(buffer)` call via `mupdf-client`. `hasTextLayer = sumChars / pageCount > 20`.
- On any failure (corrupt PDF, mupdf throws), returns `{ exoticHeavy: false, hasTextLayer: false, xobjectList: [] }` so the caller falls through to LANE A. LANE A already has best-effort catches.

### `extractImagePixmap(source, objectNum, generation)` — new, in `lib/converters/mupdf-worker.ts` + `mupdf-client.ts`

Signature:

```ts
export async function extractImagePixmap(
  source: PdfSource,
  objectNum: number,
  generation: number
): Promise<{
  width: number
  height: number
  colorspace: 'Gray' | 'RGB' | 'CMYK' | 'Bilevel'
  bytes: Uint8Array          // raw pixel data, row-major, 8bpc (or 1bpc for Bilevel)
} | null>
```

Behavior:

- Opens the doc if not cached (reuses `openPdf` cache), resolves XObject by `objectNum`/`generation`, calls mupdf's `Image.toPixmap()`.
- Returns `null` for bilevel images (colorspace never surfaces to the caller) — LANE C skips 1-bpp masks per encoding choice; JBIG2 is near-optimal for 1-bpp and re-encoding as JPEG would bloat. Colorspace union is therefore effectively `'Gray' | 'RGB' | 'CMYK'` when a pixmap is returned.
- Returns `null` on decode failure; caller preserves original XObject stream bytes.

### `planImageRecompress` / `executeImageRecompress` — extended, in `lib/converters/pdf.ts`

- `planImageRecompress`: new branch recognizes `/JBIG2Decode` and `/JPXDecode`. Records `{ kind: 'exotic', obj, ref, width, height, filter }`.
- `executeImageRecompress`: new branch for `kind: 'exotic'`. For non-bilevel:
  1. Call `extractImagePixmap(docId, ref.objectNumber, ref.generationNumber)`.
  2. Compute target pixel dimensions from `imageRenderMap` bbox + preset `targetDpi`.
  3. Downsample pixmap (nearest-neighbor for JBIG2 grayscale, bilinear for JPX color).
  4. Encode as JPEG at preset `jpegQuality` via the existing JPEG encoder used elsewhere in the pipeline.
  5. Rewrite the XObject: replace `Filter` with `/DCTDecode`, drop any decode params, replace stream contents.
- Bilevel → `extractImagePixmap` returns null → executor leaves stream intact.

### `rasterizeForTarget` — reused as-is (LANE B)

Called with preset's `targetDpi` / `jpegQuality`. Grayscale variant `rasterizeGrayscaleForTarget` when `options.grayscale === true`, matching current behavior.

## Data flow

1. Buffer read once at top of non-aggressive branch.
2. `preflightClassify(buffer, files[i].size)` — one pdf-lib load + one mupdf `extractText`. Result (including `xobjectList`) cached.
3. Router dispatches to LANE A / B / C, passing the buffer. `xobjectList` is passed down to `planImageRecompress` when the existing signature accepts a pre-enumerated list without invasive refactor; if not, `planImageRecompress` re-walks — the pdf-lib walk is cheap compared to the mupdf ops in this pipeline, so the duplicate is acceptable.
4. LANE A: current path (structural → dedupe → recompressImagesKeepText → final saveCompressed). Unchanged.
5. LANE B: reuses Aggressive's `rasterizeForTarget` + final `saveCompressed`. Same "never larger than input" guard.
6. LANE C: structural → dedupe → extended `recompressImagesKeepText` (with exotic branches) → final `saveCompressed`. mupdf `docId` opened once, reused across all `extractImagePixmap` calls, closed at end of file.
7. Exit guard unchanged: `results[i] = file.size < files[i].size ? file : files[i]`.

## Error handling

| Failure | Handling |
|---|---|
| `preflightClassify` throws | Return default flags → LANE A. |
| `extractImagePixmap` throws or returns null for non-bilevel | Skip that image, keep original XObject bytes. Never fail whole file. |
| LANE C total output ≥ input | Existing size guard returns original file. |
| Mobile detection throws | Treat as mobile → LANE B for exotic-heavy. |
| mupdf worker crash during LANE C | Existing try/catch around image pass keeps structural output. |

## Testing

**Unit (Vitest):**

- `preflightClassify` against 4 fixtures:
  1. `bwb_KR-223-812.pdf` — pure JBIG2+JPX scan → `{ exoticHeavy: true, hasTextLayer: false }`.
  2. Hybrid OCR'd scan (JBIG2 + text layer) → `{ exoticHeavy: true, hasTextLayer: true }`.
  3. Text PDF with a few JPEG figures → `{ exoticHeavy: false, hasTextLayer: true }`.
  4. Text-only PDF → `{ exoticHeavy: false, hasTextLayer: true }`.

- `extractImagePixmap`:
  - JBIG2 XObject → `colorspace: 'Bilevel'`, `null` return path exercised.
  - JPX XObject → non-null pixmap, `colorspace: 'RGB'` or `'Gray'`, dimensions match XObject dict.

**Integration (Vitest, whole `compressPDF` at `level: 'high'`):**

- Fixture 1: reduction ≥ 60% (from ~9.7 MB to under ~4 MB).
- Fixture 2: reduction ≥ 40%.
- Fixture 3: within 1% of current output size (regression guard on LANE A path).
- Fixture 4: within 1% of current output size.

**Regression:**

- Existing target-size flow tests must be unchanged (no shared code touched).
- `Aggressive` preset path unchanged.

**Manual:**

- Force `isMobile()` true → confirm exotic-heavy fixture routes to LANE B, not LANE C.
- Confirm 228-page fixture completes on desktop within reasonable time (rough budget: within 2× current `High` wall time — the mupdf `extractText` pre-pass + per-image pixmap extracts add work, but it's amortized).

## Open questions

None at design time. Threshold values (`0.5` for exotic ratio, `0.5` for image-of-file ratio, `20` chars/page for text-layer) may be tuned during implementation against a broader fixture set.

## Deferred / follow-ups

- CCITT decode branch (identical surface, add if usage data justifies).
- Progress reporting refinement for LANE B/C — current handoffs at 10 / 40 / 55 / 80 / 100 percent are adequate but not ideal for LANE C's per-image loop on very large scans.

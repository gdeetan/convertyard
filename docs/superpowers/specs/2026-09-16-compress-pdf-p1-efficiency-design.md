# Compress-PDF P1 efficiency — design

**Status:** Draft 2026-09-16
**Owner:** ConvertYard
**Depends on:** P0 keep-text pipeline (`docs/superpowers/specs/2026-09-16-compress-pdf-p0-keep-text-design.md`) merged to main.
**Feeds:** Implementation plan at `docs/superpowers/plans/2026-09-16-compress-pdf-p1-efficiency.md` (to be written next).
**Preceding docs:**
- Brief: `specs/Compress-PDF-improvement-prompt.md`
- P0 design: `docs/superpowers/specs/2026-09-16-compress-pdf-p0-keep-text-design.md`
- Spike report: `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md`

## Goal

Increase real compression ratio on the keep-text pipeline shipped in P0, without changing UX and without shipping scan codecs. Four cheap wins that each address a class of PDF where P0 currently under-compresses.

## Non-goals for P1

Deferred:
- Real glyph-level font subsetting (own spec — significant subproject)
- JBIG2 / CCITT scan codecs (blocked on WASM shippability spike)
- MRC (mixed raster content) for scans
- Shareable local compression report (own spec)
- Portal preflight (own spec)
- Live size estimate as options change (own spec)

## Scope

### In P1

1. **Per-image DPI from CTM.** Replace the fixed 300 → 150 downsample assumption with per-image effective DPI computed from the page's Current Transformation Matrix. Images already below the DPI ceiling are skipped (no re-encode). Images well above the ceiling get a proper cut.
2. **mupdf save-with-compression.** After the keep-text pass finishes structural + image work in pdf-lib, re-save the output through `mupdf-client` with compressed object streams (PDF 1.5 xref/objstm compression) enabled. Only if mupdf-client exposes the flag — if not, this feature is dropped and reported.
3. **XObject de-duplication.** Detect identical embedded images (SHA-1 of stream bytes) across pages, collapse to a single indirect XObject referenced by all pages. Common in PDFs generated from templates.
4. **Flate compression level 9.** Bump zlib compression level from default (6) to maximum (9) for our Flate-encoded output streams. Costs ~2× encode time on the Flate branch only; ~2–5% output size win.

### Out of P1

See "Non-goals" above.

## Architecture

Four independent additions to the P0 pipeline:

```
compressPdfKeepText (P0)
├── structural cleanup (existing)
├── recompressImagesKeepText (P0)
│    ├── JPEG re-encode (existing)
│    ├── Flate/PNG downsample (P0)
│    │    ├── use per-image effective DPI ────── [P1 #1]
│    │    └── use compression level 9 ────────── [P1 #4]
│    └── XObject dedup pass ─────────────────── [P1 #3]  (new step, before or after downsample)
├── grayscale (existing)
└── mupdf save-with-compression pass ─────────── [P1 #2]  (new final step)
```

The dedup pass runs BEFORE the downsample pass — we don't want to downsample the same image 40 times only to collapse afterwards.

The mupdf pass runs AS THE LAST STEP inside `compressPdfKeepText`, taking the current pdf-lib output blob and returning a compressed blob. If mupdf-client can't emit compressed object streams, the function returns the pdf-lib blob unchanged.

## Files

- `lib/pdf/image-downsample.ts`
  - Extend `DownsampleOptions` to accept `flateLevel?: number` (default 6). Pass through to `pako.deflate({ level })` when the Flate branch is used.
- `lib/converters/pdf.ts`
  - `recompressImagesKeepText`: replace hardcoded `sourceDpi: 300, targetDpi: 150` with per-image DPI derived from CTM.
  - New helper `dedupeImageXObjects(pdf: PDFDocument): { collapsed: number }` — runs before the image recompress loop.
  - New helper `mupdfSaveCompressed(bytes: Uint8Array): Promise<Uint8Array | null>` — returns `null` if mupdf-client can't emit compressed object streams.
  - Wire both into `compressPdfKeepText` at the positions shown in the architecture diagram.
- `lib/pdf/effective-dpi.ts` **(new)** — pure function `computeEffectiveDpi(image, page, ctm)` returning the source DPI at which the image is rendered. Testable in isolation.
- No UI changes. No new dependencies.

## Types

Extend the existing `TargetSizeResult` `passesRun` array to record P1 techniques when they run:

```typescript
// Additional string constants in passesRun:
//   'image-dedup:collapsed-N'   where N is the number of XObjects collapsed
//   'mupdf-save-compressed'     if the mupdf pass ran and produced a smaller output
//   'mupdf-save-noop'           if mupdf-client couldn't emit compressed object streams
```

No breaking type changes to public exports.

## Per-image DPI (feature #1)

Effective DPI of an image XObject = `image.Width / (rendered width in inches)`. Rendered width comes from the page's CTM applied to the image drawing operator's transform. In practice:

```
effectiveDpi = image.Width * 72 / renderedWidthInPoints
```

Where `renderedWidthInPoints` is derived by walking the page content stream, tracking the graphics state, and reading the `cm` (concat matrix) + `Do` (draw XObject) sequence.

pdf-lib does not walk content streams. Options:
- **Preferred:** use `mupdf-client` (already a project dep) to enumerate images per page with their rendered bboxes. `mupdf.Page.getImages()` returns bbox + XObject ref per instance.
- **Fallback:** if mupdf-client's TS surface doesn't expose per-image bboxes cleanly, skip this feature for P1 and keep the fixed 300→150. Flag it in the plan as a spike-blocked item.

Decision made in the plan: assume mupdf-client exposes it (based on reading `mupdf.worker.ts` for the API) OR the plan first-step is a 30-minute verification.

## mupdf save-with-compression (feature #2)

MuPDF's `PDFDocument.save()` accepts flags for compressed object streams. The exact TS binding shape in the current `mupdf` package (^1.27.0) needs verification. If the flag is exposed as a save option (e.g., `{ compressStreams: true, garbage: 'compact' }`), the implementation is a 20-line wrapper. If not, this feature is dropped and reported in the impl commit message.

If mupdf-client throws on any of the input bytes, catch and return `null` — never break the pipeline.

## XObject de-duplication (feature #3)

Algorithm:
1. Enumerate all indirect objects. For each `PDFRawStream` whose `/Subtype` is `Image`, compute `sha-1(streamBytes)`.
2. Build a map `sha1 → first PDFRef`.
3. For subsequent images with the same sha, rewrite all page-level resource dictionaries that reference the duplicate ref to point at the first ref. Delete the duplicate indirect object.
4. Return the number of collapsed refs.

Only exact byte-identical streams are collapsed. Near-duplicate detection (perceptual hashing) is out of scope.

**Safety:** an image XObject may have per-instance `/SMask`, `/Decode`, or `/Interpolate` overrides in its dictionary. Only collapse if the FULL dictionary is byte-identical, not just the stream. In practice this happens for templated PDFs where the same image is `Do`-drawn on many pages via the same XObject ref already — this pass mostly helps when the source generator inlined the same bytes under different refs.

## Flate compression level 9 (feature #4)

Trivial:

```typescript
pako.deflate(bytes, { level: 9 });
```

Cost: encode time up ~2× on the Flate branch. On the Flate/PNG downsample path this affects the fallback "keep as FlateDecode" branch (when source is already below the DPI ceiling — we still re-emit at level 9 to shrink the stream). On the "downsample and re-encode as JPEG" branch there is no Flate involved.

## Error handling

- Per-image DPI: if CTM lookup throws for any image, skip that image (use the P0 default of 300 DPI so downsample still runs).
- mupdf pass: if any exception, return the pdf-lib output unchanged.
- Dedup: if sha computation throws (unlikely), skip that image.
- Level 9: no new error path; identical to level 6 API.

Nothing in P1 is allowed to hard-fail the keep-text pipeline. Every feature has a "skip and continue" fallback.

## Testing

Framework: Vitest, jsdom env for anything that touches OffscreenCanvas or React.

1. **Unit — `effective-dpi.ts`** — pure computation, easy to test with a hand-built page + fake CTM.
2. **Unit — `dedupeImageXObjects`** — synthetic PDF with 3 copies of the same image; assert result reports 2 collapsed and output has 1 image XObject.
3. **Unit — `mupdfSaveCompressed`** — given a fixture, assert output ≤ input bytes; if `null` returned (unsupported), assert graceful skip and no crash.
4. **Integration — `compressPdfKeepText`** — same test file as P0. Add: given `fixtures/pdf-keep-text/text-with-png.pdf`, P1-enabled output MUST be smaller than P0-only output. Delta threshold: at least 3% improvement or the test fails (P1 has to pay for itself).
5. **Regression** — every existing P0 test in `pdf-keep-text.test.ts` must still pass.

**Fixture additions:**
- `fixtures/pdf-keep-text/text-with-duplicate-images.pdf` (new) — 3 pages, same PNG embedded 3 times under 3 different XObject refs. Committed if under 5 MB; else generated by a script in `spike/scripts/`.

## Verification checklist (PR gate)

- [ ] `compressPdfKeepText` never rasterizes (unchanged from P0).
- [ ] Every P1 feature has a fallback that leaves output ≥ P0 quality (no feature makes things worse on any fixture).
- [ ] Each feature is independently toggleable via internal constants in `lib/converters/pdf.ts` — makes triage easier if one feature ships a bug.
- [ ] Bundle size does not increase — no new dependencies.
- [ ] Text-heavy PDF: mupdf pass shrinks output by ≥ 5% vs P0-only output.
- [ ] Image-heavy PDF with duplicate assets: dedup collapses at least the expected count.
- [ ] Text-with-png fixture: P1-enabled output is at least 3% smaller than P0-only output.
- [ ] Vitest suite 100% pass on the PDF subpaths.

## Success criteria

Real compression numbers improve on 3 fixture classes:
- Text-heavy digital PDF: at least +10% shrink vs P0 (from font-related structural gains via mupdf pass + level 9).
- Image-heavy PDF where source DPI ≪ 300: dedup + per-image DPI produce >0% gain where P0 was a no-op.
- PDFs already under target (no image work triggered): mupdf pass alone shrinks by 5–15%.

If any of the four features shows negative return on the whole fixture set at PR time, that feature is dropped (leaves the constant flag off).

## Next step after this spec

Approval → write implementation plan at `docs/superpowers/plans/2026-09-16-compress-pdf-p1-efficiency.md` and hand off to `superpowers:subagent-driven-development` for execution after P0 merges to main.

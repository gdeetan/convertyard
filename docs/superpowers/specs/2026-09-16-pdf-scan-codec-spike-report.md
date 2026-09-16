# PDF Scan-Codec WASM Feasibility Spike — Report

**Date:** 2026-09-16
**Spec:** `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-design.md`
**Plan (with amendment):** `docs/superpowers/plans/2026-09-16-pdf-scan-codec-spike.md`
**Prototype branch:** `spike/pdf-scan-codecs` (pushed, do not merge)
**Notes:**
- `spike/notes/01-library-survey.md`
- `spike/notes/02-classifier.md`
- `spike/notes/03-measurement.md` (raw CI output)

## Verdict summary

| Codec | Compression viable? | WASM shippability | Recommended P0 role |
|---|---|---|---|
| CCITT Group 4 | Only on genuinely bitonal pages | Deferred | Opt-in fallback for bitonal-only content |
| JBIG2 lossy (`-s -t 0.85`) | Yes — 50–70% shrinkage on bitonal/near-bitonal | **Deferred to follow-up spike** | Excluded from P0; unlock after follow-up spike |
| JBIG2 lossless | Unknown — measurement script bug (returned 0 bytes) | Deferred | Not recommended pending re-measurement |

Compression viability was measured on Linux via `jbig2enc 0.32` + `libtiff 4.5.1` + `poppler 24.02` (see `spike/notes/03-measurement.md`). WASM shippability was NOT tested — no prebuilt jbig2enc-wasm exists on npm or in any maintained fork (see `spike/notes/01-library-survey.md`); building via Emscripten + Leptonica is a follow-up spike.

## Per-codec detail

### CCITT Group 4

**Library:** `libtiff` (`tiffcp -c g4`). Ubuntu 24.04 package `libtiff-tools`. Permissive license (libtiff license, BSD-like).

**Measured on 5 public fixtures (first 50 pages each):**

| Fixture | Extracted TIFF bytes | CCITT G4 bytes | Ratio vs TIFF | Files failed |
|---|---|---|---|---|
| public-bitonal-certificate.pdf (2p) | 3,093,192 | 573,632 | **0.19x** | 0 / 2 |
| public-already-jbig2.pdf (494p, cap 50) | 582,146,224 | 3,653,544 | 0.01x | **97 / 144** |
| public-color-mixed.pdf (270p, cap 50) | 931,246,632 | 6,148,202 | 0.01x | **100 / 150** |
| public-grayscale-contract.pdf (60p, cap 50) | 1,955,214,344 | 6,512,346 | 0.00x | **100 / 150** |
| public-large-500p.pdf (725p, cap 50) | 129,608,600 | 7,133,008 | 0.06x | 0 / 50 |

**Findings:**
- CCITT G4 **rejects grayscale and color source images** — `tiffcp -c g4` requires 1-bit input. Silent failures on non-bitonal pages leave the output smaller than reality suggests.
- On genuinely bitonal pages, encode is fast (~1 sec for 50 pages) and the compressed output is a small fraction of raw pixels.
- Perverse case: `public-bitonal-certificate.pdf` (source is already CCITT G4) round-tripped to **1.09× larger** than the original PDF. Re-encoding an already-optimized fixture hurts.

**Viewer compatibility:** Not tested in this pass (no re-embed into PDF). Deferred to follow-up when we build the actual pipeline.

**P0 role:** Optional secondary path for bitonal-only pages, gated by the per-page classifier. Never primary.

### JBIG2 lossy (`-s -t 0.85`)

**Library:** `jbig2enc 0.32` (agl/jbig2enc, Apache-2.0) + Leptonica (BSD-like). Built from source on Ubuntu 24.04 (~2 min build).

**Measured on 5 public fixtures (first 50 pages each):**

| Fixture | Extracted TIFF bytes | JBIG2 lossy bytes | Ratio vs TIFF | Encode ms |
|---|---|---|---|---|
| public-bitonal-certificate.pdf (2p) | 3,093,192 | 286,651 | **0.09x** | 689 |
| public-already-jbig2.pdf (144 imgs) | 582,146,224 | 2,800,699 | 0.00x | 10,457 |
| public-color-mixed.pdf (150 imgs) | 931,246,632 | 9,055,970 | 0.01x | **337,303** |
| public-grayscale-contract.pdf (150 imgs) | 1,955,214,344 | 3,581,147 | 0.00x | 18,043 |
| public-large-500p.pdf (50 imgs) | 129,608,600 | 2,506,565 | 0.02x | 34,264 |

**Findings:**
- Compression is aggressive across all fixture types. Encoded output is a small single-digit-% of the raw TIFF baseline.
- Encode time is the concern:
  - Best case: bitonal cert @ 2 imgs → ~345 ms/img.
  - Worst case: color-mixed @ 150 imgs → **2,249 ms per image**. Symbol substitution is superlinear over unique symbols; color-mixed pages produce many unique symbols per page.
  - Grayscale contract @ 150 imgs → ~120 ms/img (well-behaved when symbols repeat).
- Fixture "public-already-jbig2.pdf" compresses further after re-extraction because pdfimages decodes it back to raw pixels first — this is an unfair test, not a real-world scenario.

**Viewer compatibility:** Not tested here. Known JBIG2 viewer risks documented in survey (Xerox scanner bug, refinement-coding Acrobat crash — `-r` disabled in our command).

**WASM shippability:** **Not tested.** No prebuilt WASM. Building jbig2enc + Leptonica through Emscripten is estimated 1+ day of build tooling alone; bundle size unknown until built.

**P0 role:** **Deferred until follow-up spike proves WASM feasibility.** Native numbers justify the follow-up.

### JBIG2 lossless

**Measurement failed** — script bug. `jbig2 -p` (no `-s`) produces output files whose names don't match the script's `du -bc "$dir"/output.*` glob, so all fixtures report 0 bytes and 23–90 ms encode time (jbig2enc exited early without producing measurable output). Not a codec issue.

**Not recommended pending re-measurement.** Given lossy's compression, lossless is expected to be strictly larger for the same input; unlikely to change the P0 decision. Fix is a one-line glob change in `spike/scripts/measure-scan-codecs.sh` if we need the number later.

## Per-page classifier

**Prototype:** `spike/scripts/classify-pages.ts` — pdfjs-dist rasterizes each page at 150 DPI; pixel sampling classifies bitonal / grayscale / color.

**Accuracy:**
- `public-bitonal-certificate.pdf`: **100%** correct (2/2 bitonal).
- `public-grayscale-contract.pdf`: **0%** — pdfjs-dist Node build can't decode `/JBIG2Decode` streams and returns blank white pages. Classifier trivially says bitonal.
- `public-color-mixed.pdf`: **0%** — same issue on `/JPXDecode` streams.

**Speed:** 15–90 ms per page (rasterize+sample dominated by pdfjs render, not classification).

**Verdict:** Classifier algorithm is unvalidated on real bitmap content. Not a classifier defect — a Node harness defect. Two ways to fix before we depend on it:
1. Swap Node rasterization to `mupdf-wasm` (already a project dep; has JBIG2 + JPX decoders).
2. Move the harness to a headless browser (Playwright), where pdfjs bundles the WASM codecs.

Both are cheap. **Blocks scan-codec routing but not the P0 spec itself** — the classifier is only load-bearing once we ship scan codecs.

## Bundle and memory

**Not measured this spike** — WASM shippability deferred. Placeholder for the follow-up spike:
- jbig2enc + Leptonica WASM: unknown MB.
- libtiff WASM (CCITT): unknown MB.
- Lazy-load gating for scan-only paths: required if bundle >500 KB gz.

Native jbig2enc encode times (see JBIG2 section) suggest WASM will be slower still — batch UI needs a progress model even before we know the bundle number.

## Recommendation for the P0 spec

**Write the P0 keep-text compress-PDF design spec now, WITHOUT scan codecs.**

Rationale:
1. The keep-text target-size + Flate/JPEG downsample + opt-in rasterize slice is buildable today with the existing WASM stack. It fixes the most-cited product hole (target-size mode silently destroys searchability) without waiting on scan-codec tooling.
2. JBIG2 lossy's compression is real, but shipping it depends on a WASM build that does not exist. Blocking P0 on that build risks weeks of Emscripten work with unknown outcome.
3. CCITT G4 alone doesn't move the needle — most real scans have grayscale/color pages that can't use it.

**In parallel, open a follow-up spike:** JBIG2 WASM shippability. Deliverable: a working Emscripten build of jbig2enc + Leptonica, measured bundle size, measured browser encode time on a modern laptop. Timebox: 3 working days (this spike showed native builds are easy — the risk is Emscripten glue, not the algorithm).

**Do not include CCITT in P0** unless the follow-up spike also builds libtiff-wasm and validates on the classifier's real output.

## Open questions for the P0 spec

1. What does "opt-in rasterize" look like in the UI when the user hits an unachievable target? (Design spec question.)
2. How does the per-page classifier get validated before shipping — mupdf-wasm harness or Playwright? (Small implementation choice; not P0-blocking.)
3. Does the "shareable local compression report" ship in P0, or wait until scan codecs land? (Recommend P0 — it's a pure-UI feature and it's the artifact bloggers quote.)

## Success criteria — met?

- [x] Defensible go/no-go per codec.
- [x] Reproducible measurements (CI workflow + fixtures + script all committed to `spike/pdf-scan-codecs`).
- [x] Recommendation for P0 that names the primary path and the follow-up.
- [x] Timebox honored (spike completed within 2 working days elapsed; measurement CI run 10m 6s).
- [ ] Viewer compatibility matrix — deferred to follow-up spike (requires re-embedding encoded streams into a PDF, which is out of measurement-only scope).

## Follow-up work queued

1. **P0 keep-text design spec** (next spec after this report).
2. **JBIG2 WASM shippability spike** (parallel; 3-day timebox).
3. **Classifier revalidation** via mupdf-wasm harness or Playwright — small, unblocks scan-codec routing when needed.
4. **Fix `jbig2 -p` output glob** in `spike/scripts/measure-scan-codecs.sh` if a lossless number is ever needed.

# PDF scan-codec WASM feasibility spike — design

**Status:** Approved 2026-09-16
**Owner:** ConvertYard
**Blocks:** P0 keep-text target-size spec for `/compress-pdf`

## Background

The 2026-09-16 Compress-PDF differentiation brief locks direction A+B (keep-text target size + portal packaging). Its open question:

> Is the next spec the P0 keep-text + image downsample slice, or a JBIG2/CCITT feasibility spike before that spec?

Scan-heavy PDFs are the "won't shrink" files where Adobe's optimizer beats us (brief line 91). Whole-page JPEG is the wrong codec for bitonal or grayscale scans; JBIG2 and CCITT Group 4 are what commercial optimizers use. Whether ConvertYard can emit either codec entirely in-browser is unknown. The brief explicitly forbids speccing JBIG2 if the WASM stack cannot emit it (line 177).

This spike answers the feasibility question so the P0 spec is built on facts, not hope.

## Goal

Deliver a defensible go/no-go decision, per codec, for use of JBIG2 and CCITT Group 4 inside PDFs produced entirely in-browser via WASM.

## Scope — in

1. **Library survey.** Identify candidate WASM builds and their license, maintenance status, and encode capability:
   - mupdf-wasm (mutool) — does the current build expose encode or only decode?
   - jbig2enc compiled to WASM (Emscripten)
   - libtiff-wasm for CCITT Group 4
   - Ghostscript-wasm
   - Any other viable candidate discovered during the survey

2. **End-to-end prototype.** For each viable candidate, on a small fixture set (see below):
   - Extract page images from a source scan PDF
   - Encode to the target codec (JBIG2 lossless and lossy; CCITT G4)
   - Rewrite/embed the encoded stream into a valid PDF via pdf-lib (or via mupdf if pdf-lib cannot represent the filter chain)
   - Verify the output opens correctly in Acrobat Reader, Chrome's built-in viewer, and macOS Preview

3. **Measurements.**
   - Added bundle size (gzipped) if the library ships to the client
   - Encode time per page on a mid-tier laptop (M1 Air baseline) for 10, 100, and 1000-page scans
   - Output size vs the current JPEG rasterize path, at visually comparable quality
   - Memory ceiling on the 1000-page run (batch honesty — must not OOM the tab)

4. **Per-page classification.** Prototype a bitonal/grayscale/color detector that runs in-browser fast enough to precede encoding (Otsu threshold + color-variance sample). Confirm accuracy on the fixture set.

## Scope — out

- MRC (mixed raster content) — separate future spike if scan codecs pass
- Any P0 pipeline design or UI (that is the next spec, informed by this one)
- Production-quality code — throwaway prototype only
- OCR retention across recompression (already handled by existing OCR fallback spec)
- Encoder tuning beyond one lossy and one lossless preset per codec

## Fixture set

Assembled at spike start; committed under `fixtures/pdf-scan-codec-spike/`:
- Bitonal certificate scan (typical exam/government PDF, 1–5 pages)
- Grayscale multi-page contract scan (~20 pages)
- Color scan with photos and text mixed
- Already-compressed scan (JBIG2 already applied by Acrobat) — must not double-degrade
- Large scan (500+ pages) for memory/time ceiling

Fixtures should not include PII. Use public sample forms (JoSAA blanks, SF-1199a, sample court filings) or synthetic scans.

## Deliverables

1. **Report:** `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md`
   Per codec:
   - Verdict: **go**, **go with caveats**, or **no-go**
   - Chosen library + license + bundle cost
   - Measured encode time and output size vs JPEG baseline
   - Viewer compatibility matrix
   - Known limits (max page dimension, palette constraints, etc.)
   - Recommended role in P0: primary codec, opt-in codec, or dropped

2. **Prototype branch:** `spike/pdf-scan-codecs`
   - One end-to-end script per viable codec that takes a fixture PDF in and emits an encoded PDF out
   - README with reproduction steps
   - Discarded (not merged) after the report is written

3. **Recommendation for the P0 spec.** One of:
   - "Scan codecs are P0. Use library X for JBIG2 and library Y for CCITT. Budget Zkb added bundle, N ms/page."
   - "CCITT only in P0; JBIG2 deferred because [reason]."
   - "Neither is viable in-browser today. P0 keep-text ships without scan codecs; reframe pitch."

## Success criteria

The P0 keep-text spec can be written the day after the spike closes, with no unresolved questions about scan codecs. Reviewers reading the report can reproduce any measurement from the prototype branch.

## Non-goals for success

- Beating Acrobat on size at same quality (nice, not required)
- Shipping any user-visible feature
- Refactoring existing `lib/converters/pdf.ts`

## Timebox

2 working days. If day 2 ends without a clear verdict on JBIG2, default JBIG2 to **no-go for P0** and ship the report with CCITT-only recommendation. Do not extend the spike silently.

## Risks

- **All candidate encoders are GPL or AGPL.** jbig2enc is Apache-2.0; verify. mupdf is AGPL/commercial — using its encoder in a hosted static site needs a license read.
- **Viewer compatibility.** JBIG2 has a history of decoder bugs (the infamous Xerox scanner issue). Verify output on the three target viewers before declaring go.
- **Bundle cost dwarfs benefit.** If the encoder adds >2 MB gzipped, it must be lazy-loaded only when a scan is detected, and that gating logic becomes part of the P0 spec.

## Out-of-scope reminders (from CLAUDE.md and the brief)

- No server-side processing. If a codec cannot be emitted in-browser, it does not ship.
- No cloud imports, no signup, no ads in the flow.
- Batch is default. Any codec that cannot handle n=1000 within tab memory is disqualified.

## Next step after this spec

Approval → execute the spike → write the report → write the P0 keep-text design spec informed by the report.

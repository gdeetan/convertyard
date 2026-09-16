# Task 4 — Per-page classifier prototype

Prototype: `spike/scripts/classify-pages.ts`
- Rasterizes each PDF page at 150 DPI via `pdfjs-dist/legacy` + `canvas` (node-canvas).
- Samples ~5000 evenly-spaced pixels; classifies as:
  - **bitonal**: >99% samples are near-black (all channels <=16) or near-white (>=239)
  - **grayscale**: >99% samples have max-min channel diff <=8
  - **color**: otherwise
- White canvas fill before render so JBIG2/JPX decode failures do not leak
  transparent alpha into the sampler (see caveat below).

## Runs

| Fixture | Expected | Pages | Classifier verdicts (this run) | Accuracy (this run) | Avg ms/page |
|---|---|---|---|---|---|
| public-bitonal-certificate.pdf | bitonal | 2 | 2/2 bitonal | 100% | 90.0 |
| public-grayscale-contract.pdf | grayscale | 60 | 60/60 bitonal | 0% | 22.5 |
| public-color-mixed.pdf | color | 270 | 270/270 bitonal | 0% | 14.8 |

Aggregate wall-clock: bitonal fixture 745 ms; grayscale 1.94 s (60 p);
color 4.70 s (270 p). Per-page rasterize+sample cost is dominated by
pdfjs page render (13–180 ms) — pixel sampling itself is <1 ms.

## Root cause of the 0% accuracy on grayscale + color

The Node run of `pdfjs-dist/legacy` cannot decode the `/JBIG2Decode` or
`/JPXDecode` image streams that dominate these two fixtures:

```
Warning: #getJsModule: Error [ERR_MODULE_NOT_FOUND]:
  Cannot find package 'nullopenjpeg_nowasm_fallback.js' ...
Warning: Unable to decode image "img_p101_1":
  "JpxError: OpenJPEG failed to initialize".
Warning: Unable to decode image "img_p0_1":
  "Jbig2Error: JBig2 failed to initialize".
```

Every image on every page failed to decode. Because the script pre-fills
the canvas white, the resulting bitmap is a blank white page — which the
classifier correctly labels **bitonal**. The classifier logic is fine;
the rasterization pipeline in Node is not exercising it against real
pixel data for JBIG2/JPX-heavy PDFs.

The bitonal fixture (`f1040--1990.pdf`) also emitted the same JBIG2
warnings but the pages are ~99% white space around a tax form, so the
"blank" render happened to match reality.

## Verdict on the prototype

**The classifier logic is untested against real content.** Two of three
fixtures produced blank rasters in Node, so the 100% "bitonal" verdict
for the grayscale and color fixtures does not reflect the algorithm —
it reflects pdfjs-dist failing to decode JBIG2/JPX in Node.

Per spike rules ("one iteration only"), I did not tune thresholds or
switch rasterization backends. Downstream implications:

1. In the **browser** (production target), pdfjs bundles both the JBIG2
   and OpenJPEG wasm helpers correctly, so the classifier can be
   re-validated with the same logic in an actual browser context. That
   is the correct next test, not a Node-side fix.
2. If we want a Node harness for offline evaluation, the pragmatic
   swap is **mupdf-wasm** (already a project dep, and it decodes JBIG2
   + JPX natively) or shell out to Ghostscript/`pdftoppm`. Either
   removes the pdfjs Node-native-decoder gap.
3. The 150 DPI raster cost of 15–90 ms/page (Node) is a useful upper
   bound on classifier latency — even at 270 pages it stayed under 5 s
   on Intel macOS. Sampling 5000 pixels is negligible on top.

**Recommendation:** carry the classifier logic forward but treat its
accuracy as **UNVERIFIED**. Do not ship it until it has been re-run
against these three fixtures in-browser (with pdfjs's bundled wasm
codecs) or via mupdf-wasm on the same fixtures. The current run does
not disprove the approach, but it does not support it either.

## Concerns for downstream tasks

- Any task that relies on Node-side pdfjs rasterization of these
  fixtures (visual diff, page-level extraction verification, etc.)
  will hit the same JBIG2/JPX decoder gap. Plan on mupdf-wasm in Node
  or a browser harness.
- Classifier thresholds (99% bitonal, ±8 grayscale tolerance, 5000
  samples) are first-guess values from the spec. They may need
  revision once real pixel data flows through — expect at least one
  round of tuning post-spike.
- No misclassified-page analysis is possible from this run because
  every non-blank page misclassified for the same upstream reason
  (blank raster), not because of classifier weakness.

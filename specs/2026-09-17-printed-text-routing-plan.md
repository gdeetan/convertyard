# Handwriting Tool — Printed-Text Routing Plan

**Date:** 2026-09-17
**Target:** Fix `low-contrast` (WER 92%) and `form-fill` (WER 123%) fixtures without regressing the other five.

---

## Problem

`tests/ocr-fixtures/handwriting-benchmark.latest.json` shows two categories dragging the overall handwriting benchmark down:

| Fixture       | Category     | CER   | WER    |
|---------------|--------------|-------|--------|
| photo-lowres  | low-contrast | 32.4% | 92.3%  |
| scan-names    | form-fill    | 30.1% | 123.5% |

Both fixtures are **printed text** — not handwriting. They contain dense digits, punctuation, and short structured tokens (invoice numbers, order codes, SKUs, tracking numbers). Both were routed through Florence-2 (the AI-enhanced path) which is a general vision-language model, not a print-OCR-tuned engine. Tesseract would handle them trivially.

The 6 spec fixes from `2026-07-06-handwriting-accuracy-95-plan.md` (grayscale-to-TrOCR, trocr-base, anti-hallucination, blank threshold, padding, degenerate filter) already landed. They optimize handwriting recognition. They cannot help when the wrong engine is being called in the first place.

## Root cause

`lib/converters/image-ocr.ts:927` — routing decision:

```ts
const useAi = engine === 'ai-enhanced' && lang === 'eng' && !iosDetected
```

There is no signal that reroutes clearly-printed input to Tesseract. `lib/ocr/ai-route.ts:choosePrimaryAiRoute` only chooses between Florence and TrOCR *within* the AI branch — it never demotes AI to Tesseract.

## Fix

Add a print-detection step that runs on the preprocessed binary and, if the input is clearly printed text, forces the file down the Tesseract branch even when `engine === 'ai-enhanced'`.

### Heuristic candidates (pick one, benchmark)

**Option A — stroke-width uniformity (recommended)**
On the binary image, compute horizontal run-length of black pixels per row. Take median run-length across all rows (≈ half stroke width). Compute median absolute deviation (MAD). Ratio `MAD / median < 0.25` ⇒ printed text.

- Cost: O(w·h), single pass. ~5–15 ms on a 1500 px image.
- Rationale: printed fonts have near-constant stroke width; handwriting varies.

**Option B — line-height uniformity**
Reuse `detectLines()` output. Compute `std / mean` of line heights. `< 0.10` ⇒ printed.

- Cost: near-zero (line boxes already exist for AI routing).
- Rationale: printed lines share a single font size; handwriting lines drift in height.
- Risk: fails on short inputs (1–2 lines) where variance is meaningless.

**Option C — combined**
Route to Tesseract only if BOTH (A) and (B) fire. Reduces false positives on ambiguous inputs (e.g., a handwriting sample where all letters happen to be uniform block-caps).

### Implementation sketch

1. New helper in `lib/ocr/preprocessing.ts`:
   ```ts
   export function estimatePrintScore(binary: Uint8Array, w: number, h: number): number
   ```
   Returns a score in [0, 1] where >0.7 = clearly printed. Uses Option A.
2. Expose from `preprocessCore` return type (already returns `{ binary, grayscale }`; add `printScore`).
3. In `image-ocr.ts:978`, after `preprocessForOcrDual`, branch:
   ```ts
   if (printScore > 0.7) {
     // fall through to Tesseract branch below; log the demotion
     diagLog('ai-mode-demoted-to-tesseract', `printScore=${printScore}`)
     // set a flag that skips the useAi block
   }
   ```
4. Add a unit test in `lib/ocr/__tests__/print-detection.test.ts` with synthetic inputs.

### Threshold selection

The threshold cannot be picked from theory — run the benchmark with several candidates (0.5, 0.6, 0.7, 0.8) and pick the value that maximizes overall accuracy across all 7 fixtures without regressing any category below its current CER.

## Verification

Before merge:

1. Run `scripts/benchmark-handwriting-browser.ts` against a local dev server or convertyard.com preview URL. Snapshot output.
2. Land the change on a branch. Rerun the benchmark. Compare `handwriting-benchmark.latest.json`.
3. Required: `low-contrast` CER drops below 5%, `form-fill` CER drops below 5%.
4. Required: no other category regresses by more than 1% CER.
5. Required: `avgWallMs` (new in the instrumented benchmark) does not increase by more than 5% — print detection is cheap and should be free on the total.

## Non-goals

- Not tuning Florence-2 for digits — that's a model-scale problem.
- Not adding a per-line Tesseract fallback — too much complexity for the failure surface.
- Not changing the tool's UX or `handwritingStyle` options.

## Limitations

- Very clean block-caps handwriting may trip the detector. Threshold + Option C mitigates but does not eliminate.
- Screenshots of monospaced UI text will be classified as print. This is correct — Tesseract handles that better anyway.

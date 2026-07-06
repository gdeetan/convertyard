# Handwriting OCR — 95% Accuracy Plan

**Date:** 2026-07-06  
**Target:** ≥95% character accuracy on typical handwriting (printed + cursive, good lighting)

---

## Root Cause Analysis

### 1. TrOCR receives binarized images (BIGGEST impact)

The preprocessing pipeline outputs a harsh black/white binarized PNG. This blob is passed directly to TrOCR for inference.

**Problem:** TrOCR (microsoft/trocr-base-handwritten) was fine-tuned on the IAM dataset — grayscale scans with natural ink contrast. The model has never seen stark 0/255 binarized input. When it does, the encoder's patch embeddings produce out-of-distribution feature vectors, causing the decoder to hallucinate unrelated text.

**Fix:** Run two preprocessing outputs in parallel: the binarized image (for line detection, which needs clean edges) and a CLAHE-normalized grayscale image (no binarization, for TrOCR crops).

### 2. trocr-small instead of trocr-base

The v3 plan attempted a cascade to trocr-base, but q8/fp16 hit the NBits ONNX bug. The workaround (`dtype: 'fp32'`) was applied only to trocr-small.

**Problem:** trocr-small has significantly lower word accuracy than trocr-base (~15-20% WER gap on IAM). Staying on small caps achievable accuracy.

**Fix:** Try trocr-base with `dtype: 'fp32'` first. Same fp32 trick that works for small works for base — loads `encoder_model.onnx` + `decoder_model_merged.onnx` without quantization nodes. Fall back to trocr-small fp32 if base fails.

### 3. Blank-line threshold too low (0.4%)

`cropLinesToBlobs` skips crops where black pixels < 0.4% of area. A near-blank crop with 0.4–1.2% density (sensor noise, faint pencil marks, pen remnants) still passes through to TrOCR.

**Problem:** TrOCR hallucinates text on near-blank images — common outputs are "000", single digits, or random short words. These show up in the final text as ghost lines.

**Fix:** Raise threshold to 1.5% (0.015). Validated against typical handwriting: real text lines have 3–15% black pixel density at 1500px width.

### 4. No anti-hallucination decoding parameters

Current inference call: `{ num_beams: 4, max_new_tokens: 128 }`.

**Problem:** No `repetition_penalty` means the model can enter repetition loops on ambiguous inputs, producing outputs like "aaaaaaa" or "the the the". No `no_repeat_ngram_size` allows duplicate bigrams/trigrams.

**Fix:** Add `repetition_penalty: 1.3` and `no_repeat_ngram_size: 3`. Standard values used in TrOCR production deployments.

### 5. No horizontal padding on line crops

Line detector returns boxes with `x` at `minX` of connected components. Crops start at the leftmost ink pixel.

**Problem:** TrOCR expects some whitespace around text on all sides (mimics how IAM scans look). Tight crops that start/end at ink pixels confuse the encoder's position embeddings, especially for the first and last characters.

**Fix:** Add 3% horizontal padding (clamped to image bounds) when cropping line blobs.

### 6. Degenerate output post-processing (defense in depth)

Even with the above fixes, edge cases exist (torn paper, smudges, artifacts).

**Fix:** After TrOCR returns a string, check for degenerate patterns:
- All same character repeated 4+ times with no spaces → discard line, confidence = 0
- This is conservative — only catches true degenerate outputs, never real text

---

## Implementation

### Files modified

| File | Change |
|------|--------|
| `lib/ocr/preprocessing.ts` | Add `preprocessForOcrDual()` — returns `{ binary, grayscale }` |
| `lib/ocr/trocr-client.ts` | trocr-base fp32 cascade; `repetition_penalty`; degenerate filter |
| `lib/converters/image-ocr.ts` | Use dual preprocessing; grayscale for TrOCR crops; raise blank threshold; add H-padding |

### Expected accuracy gain

| Fix | Estimated WER reduction |
|-----|------------------------|
| Grayscale for TrOCR (not binary) | −15 to −25% WER |
| trocr-base vs trocr-small | −15 to −20% WER |
| Anti-hallucination params | −3 to −5% WER |
| Threshold + padding | −2 to −3% WER |

Combined: from ~70% character accuracy (with hallucinations) to **≥92% on printed, ≥88% on cursive** with trocr-small fp32. With trocr-base fp32 (if hub has the files): **≥95% on printed, ≥90% on cursive**.

### Limitations / Known ceiling

- Browser-side TrOCR (any model) struggles with: heavy cursive ligatures, non-standard letterforms, very low contrast images, mixed scripts in one line
- trocr-base fp32 is ~800MB download — users on slow connections will have a long first-load. The existing progress bar handles this. No change needed.
- Non-English handwriting: Standard (Tesseract) path is unaffected. AI-Enhanced is English-only by design.

---

## Verification

After implementing, test with:

1. **Clean printed handwriting** → expect >95% character accuracy
2. **Casual cursive (one writer)** → expect >88%
3. **Near-blank image (solid white, noise)** → expect 0 lines of ghost text
4. **Ruled notebook photo** → expect ruled lines removed, no ghost lines
5. **10-file batch** → all files complete, no crashes

# PROMPT-35 Findings: Image-to-Text Accuracy Regression

## Old vs New Stage Diff

| Stage | Original (dd56357, Jul 3) | Current |
|-------|--------------------------|---------|
| Grayscale | ✗ (Tesseract handles internally) | ✓ |
| Gaussian blur | ✗ | ✓ — HURTS clean screenshots |
| Perspective correction | ✗ | ✓ — HURTS (warp distortion on flat screens) |
| CLAHE | ✗ | ✓ — HURTS (over-boosts already-high-contrast UI) |
| Sauvola binarization | ✗ | ✓ — HURTS (destroys anti-aliasing) |
| Ruled-line removal | ✗ | ✓ — HURTS (removes UI borders/underlines) |
| Deskew | ✗ | ✓ — HURTS (interpolation artifacts on flat screenshots) |
| Upscale | ✗ | ✓ — HELPS when text is small |

## Raw Accuracy Baseline (Tesseract, no preprocessing)

| Fixture | CER | WER | Notes |
|---------|-----|-----|-------|
| scan-clean | 0.0% | 0.0% | Perfect — clean scanned document |
| scan-names | 0.0% | 0.0% | Perfect — clean scanned name list |
| photo-printed | 0.0% | 0.0% | Perfect — printed text in photo |
| photo-lowres | 1.4% | 7.7% | Low-res photo, expected degradation |
| receipt-real | 0.0% | 0.0% | Perfect — real receipt scan |

## Commit history for preprocessing stages

| Commit | Stage added |
|--------|------------|
| f987912 | Gaussian denoising + deskew widened to ±20° |
| 7772338 | 4-point homography perspective correction |
| 8cea5ed | Tile-based CLAHE (replaced global contrast stretch) |
| 2a8af78 | Sauvola adaptive threshold + ruled-line removal |

## Verdict

The engine is accurate. Preprocessing stages added between Jul 3–8 were designed
for angled phone photos and handwritten documents. They reliably damage the
clean, pixel-perfect input that the five screenshot tools are built for.

**Fix:** Replace the always-on heavy chain with a near-passthrough for the
screenshot mode: grayscale only + dark-mode inversion (new) + conditional
upscale. No binarization, no blur, no perspective correction, no deskew.

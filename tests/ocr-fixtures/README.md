# Handwriting OCR Fixture Guide

This folder holds the benchmark set for `/handwriting-to-text`.

## Goal

Measure the real browser OCR stack against representative handwriting samples, not just printed-text OCR fixtures.

## Required files per fixture

Each fixture needs:

- one image file: `.png`, `.jpg`, `.jpeg`, `.webp`, `.heic`, or `.heif`
- one transcript file: `.txt`
- one manifest entry in `handwriting-manifest.json`

Set `"active": false` on template entries until the real image and transcript files exist.

Example:

- `mixed-cursive-note-01.jpg`
- `mixed-cursive-note-01.txt`

## Transcript rules

- Match the intended reading order exactly
- Preserve meaningful line breaks
- Preserve paragraph breaks where they matter
- Do not normalize punctuation or spelling
- If text is unreadable even to a human, omit that sample from the benchmark

## Recommended categories

- `clean-print`
- `mixed-print-cursive`
- `messy-cursive`
- `notebook-paper`
- `low-contrast`
- `camera-photo`
- `form-fill`

## Naming convention

Use descriptive IDs:

- `clean-print-01`
- `mixed-cursive-note-01`
- `messy-cursive-letter-01`
- `notebook-page-01`
- `low-contrast-note-01`
- `camera-photo-note-01`
- `form-fill-01`

## Suggested first benchmark set

Minimum:

- 3 `mixed-print-cursive`
- 3 `messy-cursive`
- 3 `notebook-paper`
- 3 `low-contrast`
- 3 `camera-photo`
- 3 `form-fill`

Better:

- 5-10 per category

## Workflow

1. Add image + transcript files into this folder
2. Add entries to `handwriting-manifest.json`
3. Run browser capture:

```bash
npx tsx scripts/benchmark-handwriting-browser.ts --base-url=https://convertyard.com --engine=ai-enhanced
```

4. Score the captured results:

```bash
node scripts/benchmark-handwriting-ocr.mjs --mode=json --input=tests/ocr-fixtures/handwriting-browser-capture.latest.json
```

5. Review:

- overall `CER`
- overall `WER`
- `lineBreakAccuracy`
- per-category averages
- route counts (`florence`, `trocr`, `tesseract`)

## Decision rule

Do not tune OCR blindly.

Use the benchmark output to answer:

- Which category fails worst?
- Which route fails worst?
- Are misses mostly recognition, spacing, or line breaks?

That determines whether the next code change should be:

- OCR router
- Florence/TrOCR ensemble
- structure analysis
- low-confidence language-model rescoring

## Screenshot fixtures

Four screenshot fixtures need real PNG images from Garrick:

- `screenshot-light.png` — light-mode UI screenshot (any app, dense text)
- `screenshot-dark.png` — dark-mode screenshot (light text on dark background)
- `screenshot-small-text.png` — screenshot with ~11–12px rendered text
- `screenshot-code.png` — code/monospace screenshot (check 0/O, 1/l/I accuracy)

Each needs a hand-typed `.txt` ground truth file. Add the ground truth text
after obtaining the real PNGs. Run `node scripts/test-ocr-accuracy.mjs` to
verify CER ≤ 0.5% after Phase 1 is complete.

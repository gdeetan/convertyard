# OCR Accuracy Baseline

## Metrics
- **CER** (Character Error Rate): edit_distance(predicted, ground_truth) / len(ground_truth). Lower is better.
- **WER** (Word Error Rate): fraction of ground-truth words NOT exactly matched. Lower is better.
- **False corrections**: words changed to a wrong value by autoCorrect. Must be 0 on clean fixtures.

## Prompt 30 Baseline
(Filled in after running the harness — see Task 2 in the plan)

| Fixture | CER (raw) | WER (raw) | Engine |
|---------|-----------|-----------|--------|
| scan-clean | TBD | TBD | Tesseract |
| scan-names | TBD | TBD | Tesseract |
| receipt-real | TBD | TBD | Tesseract |
| photo-printed | TBD | TBD | Tesseract |
| photo-lowres | TBD | TBD | Tesseract |

## After autoCorrect (Phase 2 target — Gate 2)
(Filled in after Task 7 — requires running dev server + Playwright harness)

| Fixture | CER (corrected) | WER (corrected) | False corrections |
|---------|-----------------|-----------------|-------------------|
| scan-clean | — | — | must be 0 |
| scan-names | — | — | must be 0 |
| receipt-real | — | — | must be 0 |
| photo-printed | must improve | must improve | — |
| photo-lowres | must improve | must improve | — |

## Notes
- The Playwright harness (e2e/ocr-accuracy.spec.ts) requires the dev server: `npm run dev`
- Run: `npx playwright test e2e/ocr-accuracy.spec.ts --reporter=list`
- Record printed CER/WER numbers above after each gate

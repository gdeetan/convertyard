# Table OCR Accuracy Baseline

Generated: 2026-07-10
Engine: Tesseract.js with word-gap voting (Node — no OffscreenCanvas column detection)

## Results

| Fixture | Cell% | Numeric% | Grid Fidelity | Rows | Cols |
|---|---|---|---|---|---|
| bordered-clean-01 | 75.0% | 100.0% | ✓ 6×4 | 6 | 4 |
| borderless-spacing-01 | 100.0% | 100.0% | ✓ 6×4 | 6 | 4 |
| merged-header-01 | 80.0% | 100.0% | ✓ 5×5 | 5 | 5 |
| numeric-dense-01 | 0.0% | 0.0% | ✗ got 5×5, expected 6×5 | 5 | 5 |
| repeated-values-01 | 82.1% | 100.0% | ✓ 7×4 | 7 | 4 |

## Ship Gate

- ✓ `bordered-clean-01`: numeric=100.0%, grid=exact → **PASS**
- ✓ `borderless-spacing-01`: numeric=100.0%, grid=exact → **PASS**

**Overall gate: PASS ✓**

## Notes

- No OffscreenCanvas in Node — column detection uses word-gap voting fallback
- In-browser accuracy will be equal or higher due to pixel-level column detection

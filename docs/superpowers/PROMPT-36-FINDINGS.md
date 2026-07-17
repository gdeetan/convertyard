# PROMPT-36 Table Accuracy Findings

## Fixtures needed (Garrick to supply real-world problem tables)

- `tests/ocr-fixtures/table-bordered-numeric.png` + `.csv` — bordered table with number columns
- `tests/ocr-fixtures/table-borderless-tight.png` + `.csv` — borderless, tight column spacing
- `tests/ocr-fixtures/table-skewed.png` + `.csv` — slightly rotated table
- `tests/ocr-fixtures/table-multiline-cell.png` + `.csv` — table with wrapped cell text

Once fixtures are available, run:
```bash
node scripts/test-ocr-accuracy.mjs
```

The `csvAccuracy()` function in `scripts/test-ocr-accuracy.mjs` measures both cell-level accuracy and column-alignment accuracy.

## Before/After (fill in once fixtures are supplied)

| Fixture | Cell Accuracy Before | Cell Accuracy After | Col-Align Before | Col-Align After |
|---|---|---|---|---|
| bordered-numeric | — | — | — | — |
| borderless-tight | — | — | — | — |
| skewed | — | — | — | — |
| multiline-cell | — | — | — | — |

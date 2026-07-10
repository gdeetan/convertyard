# Table Accuracy Fixtures

Benchmark fixtures for `scripts/test-table-accuracy.mjs`.

## File convention

Each fixture is a pair:
- `NAME.png` — the table image
- `NAME.expected.csv` — ground truth CSV, typed by hand or verified against the image

## Naming convention

`{category}-{descriptor}-{number}.{ext}`

Categories:
- `bordered` — table with visible grid lines
- `borderless` — table with only column spacing (no lines)
- `numeric` — tables with many numeric values (financial-style)
- `repeated` — table with identical values across cells (tests repetition sensitivity)
- `skewed` — phone photo of printed table (real-world angle/noise)
- `merged` — table with merged header rows

## Synthetic vs real

Fixtures marked `[SYNTHETIC]` below were generated from HTML using Playwright.
**Real screenshots are required for at least 4 fixtures before shipping.**
Garrick will supply real phone-photo fixtures for `skewed-phone-01`.

| Fixture | Source | Status |
|---|---|---|
| `bordered-clean-01` | HTML rendered via Playwright | SYNTHETIC |
| `borderless-spacing-01` | HTML rendered via Playwright | SYNTHETIC |
| `numeric-dense-01` | HTML rendered via Playwright | SYNTHETIC |
| `repeated-values-01` | HTML rendered via Playwright | SYNTHETIC |
| `merged-header-01` | HTML rendered via Playwright | SYNTHETIC |
| `skewed-phone-01` | Real phone photo | MISSING — Garrick to supply |

Regenerate synthetic fixtures:
```bash
node scripts/generate-table-fixtures.mjs
```

## Ground truth rules

- Headers go on line 1
- No trailing whitespace per cell
- Numbers exactly as shown in the image (no rounding)
- Empty cells: nothing between commas
- If a cell is unreadable even to a human, mark it `?`

## Ship gate

Run `node scripts/test-table-accuracy.mjs` and check:
- Numeric cell accuracy ≥ 95% on `bordered-clean-01` and `borderless-spacing-01`
- Grid fidelity exact (correct row/col counts) on those two fixtures
- `skewed-phone-01` is measured but not gated (baseline only — establishes deskew target)

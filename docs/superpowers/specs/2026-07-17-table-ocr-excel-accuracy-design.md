# Table OCR Excel Accuracy — Design Spec

**Date:** 2026-07-17  
**Scope:** `lib/converters/image-ocr.ts`, `lib/ocr/tesseract-client.ts`  
**Goal:** Improve cell-level accuracy for table-to-Excel/CSV output on borderless numeric tables.

---

## Problem

The current per-cell OCR pipeline produces character substitution errors in numeric columns (`l`→`1`, `O`→`0`, `S`→`5`) that `correctNumericGrid()` catches with regex post-hoc. It also doesn't retry low-confidence cells or apply column-type-aware cleanup. Result: incorrect percentage values and malformed N/A tokens in exported Excel files.

---

## Three Changes

### 1. Tesseract Character Whitelisting

**Where:** `lib/ocr/tesseract-client.ts` + `recognizeTablePerCell()` in `lib/converters/image-ocr.ts`

**What:**
- Add optional `whitelist?: string` field to `OcrOptions`
- In `recognizePage()`, if `whitelist` is set, pass it as `tessedit_char_whitelist` to the Tesseract worker params
- In `recognizeTablePerCell()`, after the initial full-grid pass, re-run OCR for cells in detected numeric columns with whitelist `0123456789.%,- NAna/`

**Column classification reuse:** `correctNumericGrid()` already classifies columns as >60% numeric. Extract that classification into a shared helper so whitelisting and correction use the same column-type map.

**Why whitelist over substitution:** Prevents hallucination at source. Tesseract won't produce `l` if `l` isn't a legal character. Substitution corrects after the fact and can mis-correct non-numeric text that happens to look numeric.

---

### 2. Low-Confidence Cell Retry at 2× Scale

**Where:** `recognizeTablePerCell()` in `lib/converters/image-ocr.ts`

**What:**
- After initial per-cell pass, scan confidence grid
- For any cell with `confidence < 70`, re-crop from the original bitmap at 2× scale with 8px symmetric padding
- Re-OCR with same PSM 6 + whitelist (if column is numeric)
- If retry confidence ≥ original confidence, replace cell text and confidence
- One retry per cell max

**Scale justification:** Tesseract accuracy degrades on sub-40px character heights. Most table cells in a 600–1200px wide screenshot are 12–20px tall; 2× brings them into Tesseract's sweet spot.

**Cost:** Only fires on low-confidence cells, not the full grid. Typical table has <15% cells below threshold.

---

### 3. Pattern Post-Correction (`correctTableCells`)

**Where:** New function in `lib/converters/image-ocr.ts`, called after `correctNumericGrid()`

**What:** For each cell in a numeric/percentage column:

| Pattern | Corrected to | Rationale |
|---|---|---|
| `N/S`, `N.A`, `N.A.`, `NA`, `N A` | `N/A` | Common OCR variants of N/A |
| Percentage token with `O` → `0`, `l`/`I` → `1` | fixed token | Residual after whitelist pass |
| Trailing garbage after `%` (e.g. `96.00%x`) | strip suffix | Noise pixels read as characters |
| Leading garbage before digit (e.g. `_96%`) | strip prefix | Same |
| `..` → `.` inside a number | single dot | Double-dot from ink speck |

**Scope:** Only applies to cells in columns classified as numeric (>60% numeric non-empty cells). Never touches header row (row 0) or text columns.

---

## Data Flow (table-csv / excel mode)

```
preprocessForOcr()
  → detectColumnBoundaries()  → colBounds
  → detectRowBoundaries()     → rowBounds
  → recognizeTablePerCell()
      ├── initial pass (PSM 6, no whitelist)
      ├── classifyColumns()           [extracted from correctNumericGrid]
      ├── whitelist retry for numeric cols
      └── low-confidence retry at 2x for conf < 70
  → correctNumericGrid()      [existing, uses classifyColumns]
  → correctTableCells()       [new]
  → gridToExcel() / CSV output
```

---

## Changes to `OcrOptions`

```ts
interface OcrOptions {
  oem?: number
  psm?: number
  dpi?: number
  preserveSpaces?: boolean
  whitelist?: string   // NEW — tessedit_char_whitelist
}
```

No other callers of `recognizePage()` pass `whitelist`, so this is additive and non-breaking.

---

## What This Does NOT Change

- Receipt, handwriting, general-text modes — untouched
- Column/row boundary detection — untouched
- Deskew logic — untouched
- Word-gap voting fallback (for when pixel detection fails) — untouched

---

## Success Criteria

- `table-borderless-tight` fixture: cell accuracy improves (measured by `csvAccuracy()` in `scripts/test-table-accuracy.mjs` once `.txt` ground truth wired up)
- No regression on existing fixtures (`scan-clean`, `receipt-real`, etc.) — run `node scripts/test-ocr-accuracy.mjs` before and after
- `N/A` cells in the vacuum table render as `N/A` in Excel, not `N/S` or blank
- Percentage values in numeric columns have no stray characters

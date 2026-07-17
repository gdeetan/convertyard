# Design: Image-to-Excel Speed — Full-Page OCR + Worker Fixes

**Date:** 2026-07-18  
**Status:** Approved  
**Target tool:** `/image-to-excel` (excel mode in `image-ocr.ts`)

---

## Problem

For clean digital screenshot tables (e.g. screen-grabbed Excel/web tables), the converter is too slow. Root causes:

1. **Sequential per-cell OCR** — a 30-row × 10-col table triggers ~300 Tesseract calls for the first pass, then ~270 more for the whitelist retry on all numeric columns. Each call is a message round-trip + image decode + LSTM inference.
2. **Tesseract worker destroyed on options change** — switching `{ psm: 6 }` → `{ psm: 6, whitelist: '...' }` terminates the WASM worker and reloads language data from scratch. Happens twice per image.
3. **TATR spawns a new Worker every call** — no singleton, so the Table Transformer model reloads on every conversion.
4. **Unnecessary whitelist retries** — all numeric-column cells are re-OCR'd unconditionally, even when the first pass was correct and high-confidence.

Target input: clean digital screenshots (sharp text, no noise, no rotation). Heavy preprocessing (CLAHE, Sauvola binarization, 1500px upscale) is unnecessary for this input and is not changed here — it remains in place for photo/scan paths.

---

## Approach: A + C

### A1 — Full-page OCR + spatial word-to-cell assignment

**Where:** `image-ocr.ts`, TATR path (lines ~1151–1212)

**Current flow:**
```
for each TATR cell → crop blob → recognizePage(cellBlob) → grid
```

**New flow:**
```
recognizePage(blob, PSM 6)          // single full-image OCR call
↓
words[] with bboxes
↓
for each word → find containing TATR cell by center-point → assign
↓
grid (words joined per cell)
↓
retry: per-cell OCR only for empty cells OR avg-confidence < 70%
```

**Word-to-cell assignment rule:** A word belongs to the TATR cell whose bounding box contains the word's center point `(x0+x1)/2, (y0+y1)/2`. If no cell contains the center, assign to the nearest cell by center-to-center distance (handles words slightly outside borders due to rounding).

**Retry threshold:** cells where no words were assigned, OR where the mean confidence of assigned words is below 70%. For clean screenshots, expect <5% of cells to retry.

**Grid assembly:** For each cell, join assigned words in left-to-right order by `x0`, separated by space.

**Merged header handling:** TATR detects row/column as separate objects; merged header cells (e.g. "Hard Floor Results" spanning multiple columns) will have the same text assigned across the columns that fall under it. This is acceptable — the product and data cells are the priority.

### A2 — Smarter numeric whitelist retry

**Where:** `image-ocr.ts`, whitelist retry block (lines ~1192–1207)

**Current:** re-OCR every cell in every numeric column with whitelist, unconditionally.

**New:** skip the whitelist re-OCR for a cell if:
- `isNumericish(grid[r][c])` returns true AND
- `confidence[r][c] >= 80`

Only cells that are already wrong-looking OR low-confidence get the retry. For clean screenshot inputs, most numeric cells pass this check on first attempt.

### C1 — Fix Tesseract worker lifecycle

**Where:** `lib/ocr/tesseract-client.ts`, `getWorker()`

**Current:** `optsKey` includes `whitelist`, so any change to whitelist tears down and recreates the worker (full WASM + language data reload).

**New:** Split the worker key into two tiers:
- **Hard key** (triggers worker recreation): `lang`, `oem`, `dpi`, `preserveSpaces` — these require a new worker because they affect initialization.
- **Soft key** (uses `setParameters` on existing worker): `psm`, `whitelist` — these can be updated on a live worker via `worker.setParameters({...})`.

If only soft-key parameters differ from current worker, call `setParameters` and update `currentOpts` without terminating.

### C2 — Fix TATR worker singleton

**Where:** `lib/ocr/table-structure-client.ts`, `detectTableStructure()`

**Current:** `const w = new Worker(workerUrl, { type: 'module' })` on every call — model reloads every time.

**New:** Cache the worker at module scope:
```typescript
let tatrWorker: Worker | null = null
function getTatrWorker(): Worker {
  if (!tatrWorker) {
    tatrWorker = new Worker(new URL('@/lib/converters/transformers-worker.ts', import.meta.url), { type: 'module' })
  }
  return tatrWorker
}
```

The worker stays alive after first load. Model is already loaded in the worker after the first `load` message; subsequent calls skip directly to inference. Add a `model-ready` state flag so repeated calls don't re-send `load` if the model is already loaded.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/converters/image-ocr.ts` | Replace per-cell loop with full-page OCR + word assignment; smarter whitelist retry |
| `lib/ocr/tesseract-client.ts` | Split hard/soft key; use `setParameters` for soft-key changes |
| `lib/ocr/table-structure-client.ts` | Cache TATR worker at module scope; skip re-load if already ready |

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Tesseract calls per image (30×10 table) | ~570 | ~1–5 |
| Worker recreations per image | 2 | 0 |
| TATR model reloads per conversion | 1 | 0 (after first) |
| Perceived time for clean screenshot | 20–40s | 2–5s |

Accuracy: unchanged for clean digital screenshots. Per-cell retry remains for empty/low-confidence cells.

---

## Out of Scope

- Preprocessing changes (CLAHE, Sauvola, upscale) — kept as-is, already gated behind `preprocessingMode`
- Multi-worker parallelism for per-cell OCR (Approach B) — not needed given A's gains
- Merged cell support in Excel output — TATR doesn't output merge info; not addressed here

# Image-to-Excel Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ~500 sequential per-cell Tesseract calls with a single full-page OCR pass + spatial word-to-cell assignment, and fix two worker lifecycle bugs that cause WASM reloads on every conversion.

**Architecture:** TATR detects cell bounding boxes; a single Tesseract PSM 11 (sparse text) call on the full image returns all word positions; `assignWordsToCells()` maps each word to its containing TATR cell by center-point containment; only empty or low-confidence cells get targeted per-cell retries. Separately: Tesseract worker is patched to use `setParameters()` for soft-key changes instead of full teardown/recreate, and the TATR web worker is cached as a module-level singleton.

**Tech Stack:** Tesseract.js v7, transformers.js TATR model, OffscreenCanvas, vitest

---

## File Map

| File | Change |
|------|--------|
| `lib/ocr/table-structure-client.ts` | Cache TATR worker + model-ready state at module scope |
| `lib/ocr/tesseract-client.ts` | Split hard/soft opt key; use `setParameters` for soft changes |
| `lib/converters/image-ocr.ts` | Add `assignWordsToCells()`; replace per-cell loop with full-page OCR + assignment + targeted retry |
| `lib/converters/__tests__/image-ocr-word-assign.test.ts` | Unit tests for `assignWordsToCells()` (pure function) |

---

## Task 1: Fix TATR Worker Singleton (C2)

**Files:**
- Modify: `lib/ocr/table-structure-client.ts`

- [ ] **Step 1: Read the current file**

Open `lib/ocr/table-structure-client.ts` and note lines 46–94 (`detectTableStructure`). Confirm that `new Worker(workerUrl, { type: 'module' })` is called inside the function (not cached).

- [ ] **Step 2: Replace with singleton worker + model-ready flag**

Replace the entire `detectTableStructure` function (lines 46–94) with:

```typescript
let tatrWorker: Worker | null = null
let tatrReady = false

export function detectTableStructure(
  imageBlob: Blob,
  onProgress?: (pct: number) => void,
): Promise<TatrDetection[]> {
  return import('@/lib/converters/transformers-client').then(({ loadTransformersModel: _load }) => {
    void _load
    return new Promise<TatrDetection[]>((resolve, reject) => {
      if (!tatrWorker) {
        tatrWorker = new Worker(
          new URL('@/lib/converters/transformers-worker.ts', import.meta.url),
          { type: 'module' }
        )
        tatrReady = false
        tatrWorker.addEventListener('error', () => { tatrWorker = null; tatrReady = false })
      }

      const w = tatrWorker
      const id = crypto.randomUUID()

      const inferHandler = (e: MessageEvent) => {
        const d = e.data
        if (d.id !== id) return
        if (d.type === 'infer-progress') {
          onProgress?.(d.progress as number)
        } else if (d.type === 'infer-result') {
          w.removeEventListener('message', inferHandler)
          try { resolve(JSON.parse(d.result as string) as TatrDetection[]) }
          catch { resolve([]) }
        } else if (d.type === 'error') {
          w.removeEventListener('message', inferHandler)
          tatrWorker = null; tatrReady = false
          reject(new Error(d.message as string))
        }
      }
      w.addEventListener('message', inferHandler)

      const doInfer = () => {
        imageBlob.arrayBuffer().then(buffer => {
          w.postMessage(
            { type: 'infer', id, modelType: 'table-structure', buffer, mimeType: imageBlob.type || 'image/png', opts: {} },
            [buffer]
          )
        }).catch(reject)
      }

      if (tatrReady) {
        doInfer()
      } else {
        const readyHandler = (e: MessageEvent) => {
          if (e.data.type === 'model-ready' && e.data.modelType === 'table-structure') {
            w.removeEventListener('message', readyHandler)
            tatrReady = true
            doInfer()
          } else if (e.data.type === 'error' && !e.data.id) {
            w.removeEventListener('message', readyHandler)
            tatrWorker = null; tatrReady = false
            reject(new Error(e.data.message as string))
          }
        }
        w.addEventListener('message', readyHandler)
        w.postMessage({ type: 'load', modelType: 'table-structure' })
      }
    })
  })
}
```

Also remove the now-unused `loadTableStructureModel` function (lines 42–44) since callers should use `detectTableStructure` directly. Keep `buildGridCells`, `TatrBox`, `TatrDetection`, `TableCellBBox` exports unchanged.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors from `table-structure-client.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/ocr/table-structure-client.ts
git commit -m "perf(tatr): cache worker singleton — skip model reload after first conversion"
```

---

## Task 2: Fix Tesseract Worker Soft-Key Update (C1)

**Files:**
- Modify: `lib/ocr/tesseract-client.ts`

- [ ] **Step 1: Read the current `getWorker` function**

Open `lib/ocr/tesseract-client.ts`, lines 36–68. Note:
- Module-level state: `workerInstance`, `currentLang`, `currentOpts`
- `currentOpts` encodes `whitelist` in the key — any whitelist change terminates the worker

- [ ] **Step 2: Replace module-level state and `getWorker`**

Replace lines 36–68 with:

```typescript
let workerInstance: Tesseract.Worker | null = null
let currentLang: string | null = null
let currentHardKey: string | null = null
let currentOpts: string | null = null

async function getWorker(lang: string, opts: OcrOptions): Promise<Tesseract.Worker> {
  // Hard key: params that require a new worker (engine init, lang pack)
  const hardKey = `${lang}:oem${opts.oem ?? 1}:dpi${opts.dpi ?? 0}:sp${opts.preserveSpaces ? 1 : 0}`
  // Soft key: params that can be updated on a live worker via setParameters
  const softKey = `psm${opts.psm ?? 3}:wl${opts.whitelist ?? ''}`
  const fullKey = `${hardKey}:${softKey}`

  if (workerInstance && currentHardKey === hardKey) {
    if (currentOpts !== fullKey) {
      // Update PSM and whitelist without recreating the worker
      await workerInstance.setParameters({
        tessedit_pageseg_mode: opts.psm ?? 3,
        tessedit_char_whitelist: opts.whitelist ?? '',
      } as Record<string, unknown>)
      currentOpts = fullKey
    }
    return workerInstance
  }

  // Hard key changed — recreate worker
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }

  try {
    diagLog('tesseract-worker-create', lang)
    diagMemory('before-tesseract-worker')
    workerInstance = await Tesseract.createWorker(lang)
    await workerInstance.setParameters({
      tessedit_ocr_engine_mode: opts.oem ?? 1,
      tessedit_pageseg_mode: opts.psm ?? 3,
      ...(opts.dpi ? { user_defined_dpi: opts.dpi } : {}),
      ...(opts.preserveSpaces ? { preserve_interword_spaces: 1 } : {}),
      ...(opts.whitelist ? { tessedit_char_whitelist: opts.whitelist } : {}),
    } as Record<string, unknown>)
    currentLang = lang
    currentHardKey = hardKey
    currentOpts = fullKey
    diagLog('tesseract-worker-ready', lang)
  } catch (err) {
    diagError('tesseract-worker-create-fail', err)
    workerInstance = null
    currentLang = null
    currentHardKey = null
    currentOpts = null
    throw err
  }
  return workerInstance
}
```

Also update `terminateOcrWorker` to reset `currentHardKey`:

```typescript
export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
    currentLang = null
    currentHardKey = null
    currentOpts = null
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors from `tesseract-client.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/ocr/tesseract-client.ts
git commit -m "perf(tesseract): use setParameters for psm/whitelist changes — eliminates WASM worker reload"
```

---

## Task 3: Write Failing Tests for `assignWordsToCells`

**Files:**
- Create: `lib/converters/__tests__/image-ocr-word-assign.test.ts`

`assignWordsToCells` is a pure function: given a list of words with bboxes and a list of TATR cell bboxes, return a Map from `"row,col"` to `{ text, confidence }`. No browser APIs involved.

- [ ] **Step 1: Create the test file**

Create `lib/converters/__tests__/image-ocr-word-assign.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { assignWordsToCells } from '../image-ocr'
import type { OcrWord } from '@/lib/ocr/tesseract-client'
import type { TableCellBBox } from '@/lib/ocr/table-structure-client'

function makeWord(text: string, x0: number, y0: number, x1: number, y1: number, confidence = 95): OcrWord {
  return { text, confidence, bbox: { x0, y0, x1, y1 }, lineIndex: 0 }
}

function makeCell(row: number, col: number, xmin: number, ymin: number, xmax: number, ymax: number): TableCellBBox {
  return { row, col, xmin, ymin, xmax, ymax }
}

describe('assignWordsToCells', () => {
  it('assigns a word to the cell containing its center point', () => {
    const words = [makeWord('100%', 10, 10, 50, 30)]
    const cells = [makeCell(0, 0, 0, 0, 60, 40)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')).toEqual({ text: '100%', confidence: 95 })
  })

  it('assigns multiple words to separate cells', () => {
    const words = [
      makeWord('Apple', 5, 5, 55, 25),   // center at (30, 15) — cell 0,0
      makeWord('100%', 65, 5, 115, 25),  // center at (90, 15) — cell 0,1
    ]
    const cells = [
      makeCell(0, 0, 0, 0, 60, 30),
      makeCell(0, 1, 60, 0, 120, 30),
    ]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Apple')
    expect(result.get('0,1')?.text).toBe('100%')
  })

  it('joins multiple words in the same cell in left-to-right order', () => {
    const words = [
      makeWord('Hard', 5, 5, 45, 25),
      makeWord('Floor', 50, 5, 100, 25),
      makeWord('Results', 105, 5, 170, 25),
    ]
    const cells = [makeCell(0, 0, 0, 0, 200, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Hard Floor Results')
  })

  it('assigns mean confidence when multiple words land in one cell', () => {
    const words = [
      makeWord('Hello', 5, 5, 45, 25, 80),
      makeWord('World', 50, 5, 100, 25, 60),
    ]
    const cells = [makeCell(0, 0, 0, 0, 120, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.confidence).toBe(70)
  })

  it('falls back to nearest cell when word center is outside all cells', () => {
    // Word center at (150, 15) is outside the only cell (0–100), nearest cell is 0,0
    const words = [makeWord('N/A', 130, 5, 170, 25)]
    const cells = [makeCell(0, 0, 0, 0, 100, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('N/A')
  })

  it('skips blank/whitespace-only words', () => {
    const words = [
      makeWord('   ', 5, 5, 45, 25),
      makeWord('', 50, 5, 100, 25),
      makeWord('Real', 105, 5, 160, 25),
    ]
    const cells = [makeCell(0, 0, 0, 0, 200, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Real')
  })

  it('returns empty map for empty inputs', () => {
    expect(assignWordsToCells([], [])).toEqual(new Map())
    expect(assignWordsToCells([makeWord('hi', 0, 0, 10, 10)], [])).toEqual(new Map())
  })

  it('handles words without bboxes (skips them)', () => {
    const words = [{ text: 'ghost', confidence: 90, bbox: undefined as unknown as OcrWord['bbox'], lineIndex: 0 }]
    const cells = [makeCell(0, 0, 0, 0, 100, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.size).toBe(0)
  })

  it('assigns each word to the correct row in a multi-row table', () => {
    const words = [
      makeWord('Dyson', 5, 5, 55, 25),   // row 0
      makeWord('100%', 65, 5, 115, 25),  // row 0
      makeWord('Shark', 5, 35, 55, 55),  // row 1
      makeWord('N/A', 65, 35, 115, 55),  // row 1
    ]
    const cells = [
      makeCell(0, 0, 0, 0, 60, 30),
      makeCell(0, 1, 60, 0, 120, 30),
      makeCell(1, 0, 0, 30, 60, 60),
      makeCell(1, 1, 60, 30, 120, 60),
    ]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Dyson')
    expect(result.get('0,1')?.text).toBe('100%')
    expect(result.get('1,0')?.text).toBe('Shark')
    expect(result.get('1,1')?.text).toBe('N/A')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail (function not exported yet)**

```bash
npm test lib/converters/__tests__/image-ocr-word-assign.test.ts
```

Expected: FAIL — `assignWordsToCells is not a function` or import error.

---

## Task 4: Implement `assignWordsToCells`

**Files:**
- Modify: `lib/converters/image-ocr.ts`

- [ ] **Step 1: Add type imports at top of `image-ocr.ts`**

Find the existing import line:
```typescript
import { recognizePage, terminateOcrWorker, type OcrOptions, type OcrPageResult } from '@/lib/ocr/tesseract-client'
```

Replace with:
```typescript
import { recognizePage, terminateOcrWorker, type OcrOptions, type OcrPageResult, type OcrWord } from '@/lib/ocr/tesseract-client'
```

Also add a new static type import after the existing imports block:
```typescript
import type { TableCellBBox } from '@/lib/ocr/table-structure-client'
```

- [ ] **Step 2: Add `assignWordsToCells` after the `correctTableCells` export (around line 307)**

Insert after the closing `}` of `correctTableCells`:

```typescript
interface WordAssignment {
  text: string
  confidence: number
}

/**
 * Assigns OCR words to TATR cell bounding boxes by word-center containment.
 * Words whose center falls outside all cells are assigned to the nearest cell.
 * Returns a Map keyed by "row,col".
 */
export function assignWordsToCells(
  words: OcrWord[],
  cells: TableCellBBox[],
): Map<string, WordAssignment> {
  const wordGroups = new Map<string, OcrWord[]>()

  for (const word of words) {
    if (!word.bbox || !word.text.trim()) continue

    const cx = (word.bbox.x0 + word.bbox.x1) / 2
    const cy = (word.bbox.y0 + word.bbox.y1) / 2

    let target = cells.find(c => cx >= c.xmin && cx <= c.xmax && cy >= c.ymin && cy <= c.ymax)

    if (!target && cells.length > 0) {
      let minDist = Infinity
      for (const c of cells) {
        const dist = Math.hypot(cx - (c.xmin + c.xmax) / 2, cy - (c.ymin + c.ymax) / 2)
        if (dist < minDist) { minDist = dist; target = c }
      }
    }

    if (!target) continue

    const key = `${target.row},${target.col}`
    const existing = wordGroups.get(key)
    if (existing) existing.push(word)
    else wordGroups.set(key, [word])
  }

  const result = new Map<string, WordAssignment>()
  for (const [key, ws] of wordGroups) {
    const sorted = ws.slice().sort((a, b) => a.bbox!.x0 - b.bbox!.x0)
    result.set(key, {
      text: sorted.map(w => w.text).join(' ').trim(),
      confidence: sorted.reduce((s, w) => s + w.confidence, 0) / sorted.length,
    })
  }
  return result
}
```

- [ ] **Step 3: Run tests — confirm they pass**

```bash
npm test lib/converters/__tests__/image-ocr-word-assign.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/image-ocr.ts lib/converters/__tests__/image-ocr-word-assign.test.ts
git commit -m "feat(image-to-excel): add assignWordsToCells — maps full-page OCR words to TATR cell bboxes"
```

---

## Task 5: Integrate Full-Page OCR Path + Smarter Retry (A1 + A2)

**Files:**
- Modify: `lib/converters/image-ocr.ts`

This replaces the existing TATR per-cell loop (lines ~1151–1212) with the full-page OCR path.

- [ ] **Step 1: Find the TATR block to replace**

In `image-ocr.ts`, locate the comment `// TATR path: use Table Transformer for structure detection, then OCR each cell` (around line 1152). The block to replace runs from `try {` through `perCellConfidence = conf` (ends around line 1211, before `} catch (tatrErr)`).

- [ ] **Step 2: Replace the TATR per-cell loop**

Replace the contents of the try block (from `const { detectTableStructure, buildGridCells }` through `perCellConfidence = conf`) with:

```typescript
        const { detectTableStructure, buildGridCells } = await import('@/lib/ocr/table-structure-client')
        onProgress?.(i, 35)
        const detections = await detectTableStructure(blob, p => onProgress?.(i, 35 + Math.round(p * 0.15)))
        const cells = buildGridCells(detections)

        if (cells.length > 0 && typeof OffscreenCanvas !== 'undefined') {
          onProgress?.(i, 50)

          // Single full-page OCR pass — PSM 11 (sparse text) returns all word positions
          // without imposing reading order; TATR cell bboxes handle the structure.
          const layoutResult = await recognizePage(blob, lang, { oem: 1, psm: 11 })
          const pageWords = layoutResult.words.filter(w => w.bbox && w.text.trim())
          const assignments = assignWordsToCells(pageWords, cells)

          let maxRow = 0
          let maxCol = 0
          for (const cell of cells) {
            maxRow = Math.max(maxRow, cell.row)
            maxCol = Math.max(maxCol, cell.col)
          }

          const grid: string[][] = Array.from({ length: maxRow + 1 }, () =>
            Array.from({ length: maxCol + 1 }, () => '')
          )
          const conf: number[][] = Array.from({ length: maxRow + 1 }, () =>
            Array.from({ length: maxCol + 1 }, () => 100)
          )

          for (const [key, assignment] of assignments) {
            const [r, c] = key.split(',').map(Number)
            if (r <= maxRow && c <= maxCol) {
              grid[r][c] = assignment.text
              conf[r][c] = assignment.confidence
            }
          }

          onProgress?.(i, 65)

          // Targeted per-cell retry: only empty cells or low-confidence assignments
          const RETRY_CONF_THRESHOLD = 70
          const retryCells = cells.filter(cell => {
            const val = grid[cell.row][cell.col]
            const cellConf = conf[cell.row][cell.col]
            return val === '' || cellConf < RETRY_CONF_THRESHOLD
          })

          if (retryCells.length > 0) {
            const bitmap = await createImageBitmap(blob)
            for (const cell of retryCells) {
              const w = Math.round(cell.xmax - cell.xmin)
              const h = Math.round(cell.ymax - cell.ymin)
              if (w < 4 || h < 4) continue
              const cellBlob = await cropToBlob(bitmap, Math.round(cell.xmin), Math.round(cell.ymin), w, h)
              const result = await recognizePage(cellBlob, lang, { oem: 1, psm: 6 })
              grid[cell.row][cell.col] = (result.text ?? '').trim()
              conf[cell.row][cell.col] = result.confidence ?? 100
            }
            bitmap.close()
          }

          onProgress?.(i, 80)

          // Smarter whitelist retry: only numeric cells that look wrong OR low-confidence
          // (not all numeric cells unconditionally as before)
          const numericCols = classifyColumns(grid)
          const needsWhitelistRetry = cells.filter(cell => {
            if (!numericCols[cell.col]) return false
            const val = grid[cell.row][cell.col]
            const cellConf = conf[cell.row][cell.col]
            return val !== '' && (!isNumericish(val) || cellConf < 80)
          })

          if (needsWhitelistRetry.length > 0) {
            const bmp2 = await createImageBitmap(blob)
            for (const cell of needsWhitelistRetry) {
              const w = Math.round(cell.xmax - cell.xmin)
              const h = Math.round(cell.ymax - cell.ymin)
              if (w < 4 || h < 4) continue
              const cellBlob = await cropToBlob(bmp2, Math.round(cell.xmin), Math.round(cell.ymin), w, h)
              const result = await recognizePage(cellBlob, lang, { oem: 1, psm: 6, whitelist: NUMERIC_WHITELIST })
              if ((result.confidence ?? 0) >= (conf[cell.row][cell.col] ?? 0)) {
                grid[cell.row][cell.col] = (result.text ?? '').trim()
                conf[cell.row][cell.col] = result.confidence ?? 100
              }
            }
            bmp2.close()
          }

          perCellGrid = correctNumericGrid(grid)
          perCellGrid = correctTableCells(perCellGrid, classifyColumns(perCellGrid))
          perCellConfidence = conf
        }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see `assignWordsToCells` or `TableCellBBox` not found, confirm the imports added in Task 4 Step 1 are present.

- [ ] **Step 4: Run full test suite to catch regressions**

```bash
npm test
```

Expected: all existing tests pass (including column-detector, florence, preprocessing tests). The new test from Task 3 also passes.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/image-ocr.ts
git commit -m "perf(image-to-excel): full-page OCR + targeted retry replaces 500+ sequential cell OCR calls"
```

---

## Task 6: Manual Browser Verification

No automated test covers the end-to-end browser pipeline. Verify manually.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Navigate to `http://localhost:3000/image-to-excel`.

- [ ] **Step 2: Test with the reference screenshots**

Upload `/Users/garrickdeetan/Desktop/Screenshot 2026-07-09 at 8.13.46 PM.png`.

Check:
- Conversion completes in **under 10 seconds** (vs previous 20–40s)
- All product names in column A are correct
- Percentage values (100%, 66%, 92%) are in the right cells
- "N/A" values land in the correct cells (not shifted to adjacent columns)
- Empty cells remain empty (not filled with noise)
- Header row reads "Product", "5"", "7"", "9"", "11"", "12"" (or similar)

- [ ] **Step 3: Test with the second screenshot**

Upload `/Users/garrickdeetan/Desktop/Screenshot 2026-07-08 at 10.23.37 PM.png`.

Same checks. Also confirm the browser footer text (Support, System Status, etc.) does not appear in the output — it should be outside TATR's detected table region.

- [ ] **Step 4: Test second conversion in same session**

Upload either screenshot a second time without refreshing the page.

Check: second conversion is **noticeably faster** than the first (TATR model already loaded, Tesseract worker already warm). If both are similarly slow, the singleton fixes (Tasks 1 and 2) may not have taken effect — re-check that `tatrWorker` is module-level and `currentHardKey` persists.

- [ ] **Step 5: Final commit**

```bash
git add -p  # review any remaining unstaged changes
git commit -m "perf(image-to-excel): speed optimisations — full-page OCR, TATR singleton, Tesseract soft-key update"
```

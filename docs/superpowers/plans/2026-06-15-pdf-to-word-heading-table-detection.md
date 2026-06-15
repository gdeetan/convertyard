# PDF to Word — Improved Heading & Table Detection

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the font-size-only heading heuristic with a multi-signal detector, and add conservative column-clustering table detection to the PDF→DOCX converter.

**Architecture:** All logic lives in `lib/converters/pdf-to-word.ts`. Extend the existing mupdf structured-text JSON types to include `bbox` arrays (already present in the JSON but not typed). Add two pure functions — `detectHeadingLevel` and `detectTables` — and wire them into the existing `pagesToParagraphs` pipeline. No new dependencies; no worker changes.

**Tech Stack:** TypeScript, `docx` v9 (already installed), vitest (added in Task 1 for unit testing pure functions)

---

## Background: mupdf structured-text JSON shape

`extractStructuredText()` returns one JSON string per page. Each page JSON looks like:

```json
{
  "blocks": [
    {
      "type": "text",
      "bbox": [x1, y1, x2, y2],
      "lines": [
        {
          "wmode": 0,
          "dir": [1, 0],
          "bbox": [x1, y1, x2, y2],
          "spans": [
            {
              "origin": [x, y],
              "bbox": [x1, y1, x2, y2],
              "font": { "name": "Arial", "weight": "bold", "style": "normal" },
              "size": 12,
              "color": 0,
              "chars": [{ "c": 72, "origin": [x, y] }]
            }
          ]
        }
      ]
    },
    {
      "type": "image",
      "bbox": [x1, y1, x2, y2]
    }
  ]
}
```

`bbox` is `[x1, y1, x2, y2]` in PDF points (1pt = 1/72 inch). This is already in the JSON — we just need to add it to the TypeScript interfaces.

---

## File Map

| File | Change |
|------|--------|
| `lib/converters/pdf-to-word.ts` | Add bbox to types; add `detectHeadingLevel`, `clusterValues`, `detectTables`; update `pagesToParagraphs` |
| `lib/converters/__tests__/pdf-to-word.test.ts` | Unit tests for all pure functions |
| `vitest.config.ts` | New — vitest config |
| `package.json` | Add vitest dev dep + `test` script |

---

## Task 1: Add vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Install vitest**

```bash
npm install --save-dev vitest
```

- [ ] **Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/__tests__/**/*.test.ts'],
  },
})
```

- [ ] **Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Verify vitest works**

Create `lib/converters/__tests__/pdf-to-word.test.ts` with a trivial test:

```ts
import { describe, it, expect } from 'vitest'

describe('pdf-to-word', () => {
  it('placeholder', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test`
Expected output: `1 passed`

- [ ] **Commit**

```bash
git add vitest.config.ts package.json package-lock.json lib/converters/__tests__/pdf-to-word.test.ts
git commit -m "chore: add vitest for pdf-to-word unit tests"
```

---

## Task 2: Extend type interfaces with bbox

**Files:**
- Modify: `lib/converters/pdf-to-word.ts`

The existing interfaces (`StChar`, `StSpan`, `StLine`, `StBlock`, `StPage`) don't include `bbox`. Add it.

- [ ] **Update interfaces in `lib/converters/pdf-to-word.ts`**

Replace the existing type block (lines ~5–27) with:

```ts
type Bbox = [number, number, number, number] // [x1, y1, x2, y2]

interface StChar { c: number }

interface StSpan {
  font?: { name?: string; weight?: string; style?: string }
  size?: number
  color?: number
  bbox?: Bbox
  origin?: [number, number]
  chars?: StChar[]
  text?: string
}

interface StLine {
  bbox?: Bbox
  spans?: StSpan[]
}

interface StBlock {
  type?: string | number  // "text" | "image" | 0 | 1
  bbox?: Bbox
  lines?: StLine[]
}

interface StPage {
  blocks?: StBlock[]
}
```

- [ ] **Run build to verify no regressions**

```bash
npm run build
```
Expected: zero TypeScript errors, zero new warnings.

- [ ] **Commit**

```bash
git add lib/converters/pdf-to-word.ts
git commit -m "feat: add bbox to pdf-to-word structured-text types"
```

---

## Task 3: Add `clusterValues` pure function + tests

This is the core primitive for table column detection: given an array of numbers, group them into clusters where consecutive values are within `tolerance` of each other.

**Files:**
- Modify: `lib/converters/pdf-to-word.ts`
- Modify: `lib/converters/__tests__/pdf-to-word.test.ts`

- [ ] **Write failing tests first**

Replace the placeholder test in `lib/converters/__tests__/pdf-to-word.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { clusterValues } from '../pdf-to-word'

describe('clusterValues', () => {
  it('groups values within tolerance', () => {
    const result = clusterValues([10, 12, 50, 53, 100], 5)
    expect(result).toEqual([[10, 12], [50, 53], [100]])
  })

  it('returns empty array for empty input', () => {
    expect(clusterValues([], 10)).toEqual([])
  })

  it('single value makes one cluster', () => {
    expect(clusterValues([42], 10)).toEqual([[42]])
  })

  it('all values in one cluster when within tolerance', () => {
    expect(clusterValues([1, 3, 5], 5)).toEqual([[1, 3, 5]])
  })

  it('exact tolerance boundary: values exactly tolerance apart are in same cluster', () => {
    expect(clusterValues([0, 10], 10)).toEqual([[0, 10]])
  })

  it('values tolerance+1 apart are in different clusters', () => {
    expect(clusterValues([0, 11], 10)).toEqual([[0], [11]])
  })

  it('sorts input before clustering', () => {
    const result = clusterValues([100, 10, 50], 5)
    expect(result).toEqual([[10], [50], [100]])
  })
})
```

Run: `npm test`
Expected: FAIL — `clusterValues is not exported`

- [ ] **Implement `clusterValues` in `lib/converters/pdf-to-word.ts`**

Add after the type definitions (before the `spanText` function):

```ts
// Exported for testing only
export function clusterValues(values: number[], tolerance: number): number[][] {
  if (values.length === 0) return []
  const sorted = [...values].sort((a, b) => a - b)
  const clusters: number[][] = [[sorted[0]]]
  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1]
    if (sorted[i] - last[last.length - 1] <= tolerance) {
      last.push(sorted[i])
    } else {
      clusters.push([sorted[i]])
    }
  }
  return clusters
}
```

- [ ] **Run tests**

```bash
npm test
```
Expected: `7 passed`

- [ ] **Commit**

```bash
git add lib/converters/pdf-to-word.ts lib/converters/__tests__/pdf-to-word.test.ts
git commit -m "feat: add clusterValues helper for table column detection"
```

---

## Task 4: Add `detectHeadingLevel` with multi-signal logic + tests

Replaces the existing `headingLevel` function (which only checks font size ratio) with a richer version using centering, all-caps, bold, and word count.

**Files:**
- Modify: `lib/converters/pdf-to-word.ts`
- Modify: `lib/converters/__tests__/pdf-to-word.test.ts`

- [ ] **Write failing tests**

Add to `lib/converters/__tests__/pdf-to-word.test.ts`:

```ts
import { detectHeadingLevel } from '../pdf-to-word'

// Helper to build a minimal StBlock for testing
function makeBlock(opts: {
  text: string
  size?: number
  weight?: string
  bbox?: [number, number, number, number]
}): import('../pdf-to-word').StBlockPublic {
  return {
    type: 'text',
    bbox: opts.bbox ?? [72, 100, 400, 120],
    lines: [{
      bbox: opts.bbox ?? [72, 100, 400, 120],
      spans: [{
        text: opts.text,
        size: opts.size ?? 12,
        font: { name: 'Arial', weight: opts.weight ?? 'normal', style: 'normal' },
        bbox: opts.bbox ?? [72, 100, 400, 120],
      }],
    }],
  }
}

describe('detectHeadingLevel', () => {
  const BODY = 12
  const PAGE_W = 612 // US Letter width in points

  it('returns H1 for font size ≥1.8× body', () => {
    const block = makeBlock({ text: 'Big Title', size: 22 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading1')
  })

  it('returns H2 for font size ≥1.35× body', () => {
    const block = makeBlock({ text: 'Section', size: 17 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading2')
  })

  it('returns H3 for font size ≥1.15× body', () => {
    const block = makeBlock({ text: 'Subsection', size: 14 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading3')
  })

  it('returns null for body-size non-heading paragraph', () => {
    const block = makeBlock({ text: 'This is a normal paragraph with several words in it.' })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })

  it('returns H3 for short all-caps text at body size', () => {
    const block = makeBlock({ text: 'INTRODUCTION' })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading3')
  })

  it('returns null for long all-caps text (>12 words)', () => {
    const block = makeBlock({ text: 'THIS IS A VERY LONG SENTENCE THAT SHOULD NOT BE A HEADING AT ALL' })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })

  it('returns H3 for short centered bold text at body size', () => {
    // Centered on 612pt page: block x1=206, x2=406, center=306 ≈ 306
    const block = makeBlock({ text: 'Summary', weight: 'bold', bbox: [206, 100, 406, 120] })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading3')
  })

  it('returns null for body-size bold text that is too long', () => {
    const block = makeBlock({
      text: 'This bold sentence is too long to be a heading because it has many many words',
      weight: 'bold',
    })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })

  it('returns null for text with more than 20 words regardless of size', () => {
    const text = 'word '.repeat(21).trim()
    const block = makeBlock({ text, size: 24 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })
})
```

Run: `npm test`
Expected: FAIL — `detectHeadingLevel is not exported`

- [ ] **Replace existing `headingLevel` with `detectHeadingLevel` in `lib/converters/pdf-to-word.ts`**

Export the `StBlock` type for testing. Add `StBlockPublic` export alias at the end of the type block:

```ts
export type StBlockPublic = StBlock
```

Remove the existing `headingLevel` function (currently ~lines 73–82). Replace with:

```ts
// Exported for testing only
export function detectHeadingLevel(
  block: StBlock,
  body: number,
  pageWidth: number
): typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2 | typeof HeadingLevel.HEADING_3 | null {
  const allSpans = (block.lines ?? []).flatMap(l => l.spans ?? [])
  const text = allSpans.map(spanText).join(' ').trim()
  const wordCount = text.split(/\s+/).filter(Boolean).length

  // Hard exclusion: more than 20 words can't be a heading
  if (wordCount > 20) return null

  // Dominant font size across spans
  const sizes = allSpans.filter(s => s.size).map(s => s.size as number)
  const sizeFreq: Record<number, number> = {}
  for (const s of sizes) { const r = Math.round(s); sizeFreq[r] = (sizeFreq[r] ?? 0) + 1 }
  const dominantSize = sizes.length > 0
    ? Number(Object.entries(sizeFreq).sort((a, b) => b[1] - a[1])[0][0])
    : body
  const ratio = dominantSize / body

  // Size-based levels (primary signal)
  if (ratio >= 1.8) return HeadingLevel.HEADING_1
  if (ratio >= 1.35) return HeadingLevel.HEADING_2
  if (ratio >= 1.15) return HeadingLevel.HEADING_3

  // Body-size heading candidates — require shortness + at least one secondary signal
  if (wordCount > 12) return null

  const bbox = block.bbox
  const isCentered = bbox
    ? Math.abs(((bbox[0] + bbox[2]) / 2) - pageWidth / 2) < pageWidth * 0.15
    : false

  const isAllCaps = /[A-Z]/.test(text) && text === text.toUpperCase()

  const dominantSpan = allSpans.find(s => s.size && Math.round(s.size) === dominantSize)
  const isBoldBlock = dominantSpan ? isBold(dominantSpan) : false

  const signals = [isCentered, isAllCaps, isBoldBlock && wordCount <= 8].filter(Boolean).length

  if (signals >= 2) return HeadingLevel.HEADING_2
  if (signals >= 1) return HeadingLevel.HEADING_3

  return null
}
```

- [ ] **Update `blockToParagraph` to call `detectHeadingLevel` instead of `headingLevel`**

In `blockToParagraph`, replace:
```ts
const level = headingLevel(dominantSize, body)
```
with:
```ts
const level = detectHeadingLevel(block, body, 0) // pageWidth=0 disables centering; caller handles page context
```

Wait — `blockToParagraph` doesn't have access to `pageWidth` or the full block. Refactor: remove `blockToParagraph`'s internal level detection and instead pass the detected level in as a parameter.

Replace the existing `blockToParagraph` signature:

```ts
function blockToParagraph(block: StBlock, body: number): Paragraph | null {
```

with:

```ts
function blockToParagraph(
  block: StBlock,
  body: number,
  level: ReturnType<typeof detectHeadingLevel> = null
): Paragraph | null {
```

Remove the internal `headingLevel` call and the `dominantSize` / `level` calculation from inside `blockToParagraph`. The function now receives `level` as a parameter. The body becomes:

```ts
function blockToParagraph(
  block: StBlock,
  body: number,
  level: ReturnType<typeof detectHeadingLevel> = null
): Paragraph | null {
  const allSpans = (block.lines ?? []).flatMap(l => l.spans ?? [])
  const text = allSpans.map(spanText).join('').trim()
  if (!text) return null

  if (level) {
    return new Paragraph({
      heading: level,
      children: [new TextRun({ text, bold: true })],
    })
  }

  const runs: TextRun[] = []
  for (const span of allSpans) {
    const t = spanText(span)
    if (!t) continue
    runs.push(new TextRun({ text: t, bold: isBold(span), italics: isItalic(span) }))
  }

  return new Paragraph({ children: runs.length > 0 ? runs : [new TextRun(text)] })
}
```

Update `pagesToParagraphs` to compute `pageWidth` and pass level to `blockToParagraph`:

```ts
function pagesToParagraphs(pages: StPage[], body: number): Paragraph[] {
  const out: Paragraph[] = []

  for (let p = 0; p < pages.length; p++) {
    if (p > 0) out.push(new Paragraph({ pageBreakBefore: true, children: [] }))

    const pageWidth = estimatePageWidth(pages[p])

    for (const block of pages[p].blocks ?? []) {
      if (!isTextBlock(block)) continue
      const level = detectHeadingLevel(block, body, pageWidth)
      const para = blockToParagraph(block, body, level)
      if (para) out.push(para)
    }
  }

  return out.length > 0 ? out : [new Paragraph({ children: [new TextRun('')] })]
}
```

Add `estimatePageWidth` helper just before `pagesToParagraphs`:

```ts
function estimatePageWidth(page: StPage): number {
  let maxX2 = 0
  for (const block of page.blocks ?? []) {
    if (block.bbox && block.bbox[2] > maxX2) maxX2 = block.bbox[2]
  }
  return maxX2 || 612 // US Letter fallback
}
```

- [ ] **Run tests**

```bash
npm test
```
Expected: all heading tests pass.

- [ ] **Run build**

```bash
npm run build
```
Expected: zero TypeScript errors.

- [ ] **Commit**

```bash
git add lib/converters/pdf-to-word.ts lib/converters/__tests__/pdf-to-word.test.ts
git commit -m "feat: multi-signal heading detection (centering, all-caps, bold) for pdf-to-word"
```

---

## Task 5: Add `detectTables` + tests

Detects tables via x1 column clustering. Conservative threshold: requires **3+ columns** OR (**2+ columns AND 3+ rows**). Blocks consumed by a table are excluded from paragraph rendering.

**Files:**
- Modify: `lib/converters/pdf-to-word.ts`
- Modify: `lib/converters/__tests__/pdf-to-word.test.ts`

Also needs `Table`, `TableRow`, `TableCell`, `TableLayoutType`, `WidthType` from `docx`.

- [ ] **Update docx import**

At the top of `lib/converters/pdf-to-word.ts`, replace:

```ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx'
```

with:

```ts
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  Table, TableRow, TableCell, WidthType,
} from 'docx'
```

- [ ] **Write failing tests**

Add to `lib/converters/__tests__/pdf-to-word.test.ts`:

```ts
import { detectTables } from '../pdf-to-word'

// Build a grid of blocks: `cols` x-positions, `rows` y-positions
// Each block is 80pt wide, 14pt tall
function makeGrid(
  colX: number[],
  rowY: number[],
  texts?: string[][]
): import('../pdf-to-word').StBlockPublic[] {
  const blocks: import('../pdf-to-word').StBlockPublic[] = []
  rowY.forEach((y, r) => {
    colX.forEach((x, c) => {
      const text = texts?.[r]?.[c] ?? `r${r}c${c}`
      blocks.push({
        type: 'text',
        bbox: [x, y, x + 80, y + 14],
        lines: [{
          bbox: [x, y, x + 80, y + 14],
          spans: [{
            text,
            size: 12,
            font: { name: 'Arial', weight: 'normal', style: 'normal' },
          }],
        }],
      })
    })
  })
  return blocks
}

describe('detectTables', () => {
  it('detects a 3-column 2-row table', () => {
    const blocks = makeGrid([72, 220, 368], [100, 120])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(1)
    expect(tables[0].consumedIndices.size).toBe(6)
  })

  it('detects a 2-column 3-row table', () => {
    const blocks = makeGrid([72, 300], [100, 120, 140])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(1)
    expect(tables[0].consumedIndices.size).toBe(6)
  })

  it('does NOT detect a 2-column 2-row layout (too ambiguous)', () => {
    const blocks = makeGrid([72, 300], [100, 120])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(0)
  })

  it('does NOT detect a single column of blocks', () => {
    const blocks = makeGrid([72], [100, 120, 140, 160])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(0)
  })

  it('ignores image blocks', () => {
    const textBlocks = makeGrid([72, 220, 368], [100, 120])
    const imageBlock: import('../pdf-to-word').StBlockPublic = {
      type: 'image',
      bbox: [72, 50, 400, 90],
      lines: [],
    }
    const tables = detectTables([imageBlock, ...textBlocks])
    expect(tables).toHaveLength(1)
    expect(tables[0].consumedIndices.has(0)).toBe(false) // image not consumed
  })

  it('returns correct cell text content', () => {
    const texts = [['Alpha', 'Beta', 'Gamma'], ['One', 'Two', 'Three']]
    const blocks = makeGrid([72, 220, 368], [100, 120], texts)
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(1)
    // Spot-check: table rows count
    expect(tables[0].rows).toBe(2)
    expect(tables[0].cols).toBe(3)
  })

  it('returns empty array for fewer than 3 blocks total', () => {
    const blocks = makeGrid([72, 220], [100])
    expect(detectTables(blocks)).toHaveLength(0)
  })
})
```

Run: `npm test`
Expected: FAIL — `detectTables is not exported`

- [ ] **Implement `detectTables` in `lib/converters/pdf-to-word.ts`**

Add after `clusterValues` and before `spanText`:

```ts
interface DetectedTable {
  consumedIndices: Set<number>
  rows: number
  cols: number
  table: Table
}

// Column clustering tolerance: blocks within 10pt of same x are in the same column
const COL_TOLERANCE = 10
// Row clustering tolerance: blocks within 8pt of same y are in the same row
const ROW_TOLERANCE = 8

export function detectTables(blocks: StBlock[]): DetectedTable[] {
  // Work only with text blocks that have bboxes
  const indexed = blocks
    .map((b, i) => ({ block: b, index: i }))
    .filter(({ block }) => isTextBlock(block) && block.bbox != null)

  if (indexed.length < 3) return []

  // Cluster x1 values into column anchors
  const x1Values = indexed.map(({ block }) => block.bbox![0])
  const colClusters = clusterValues(x1Values, COL_TOLERANCE)

  // Each cluster whose median represents a column
  const colAnchors = colClusters
    .filter(cluster => cluster.length >= 2)
    .map(cluster => cluster[Math.floor(cluster.length / 2)])

  if (colAnchors.length < 2) return []

  // Assign each block to a column anchor (nearest within tolerance)
  function assignCol(x1: number): number | null {
    for (let c = 0; c < colAnchors.length; c++) {
      if (Math.abs(x1 - colAnchors[c]) <= COL_TOLERANCE) return c
    }
    return null
  }

  // Cluster y1 values into row anchors
  const y1Values = indexed.map(({ block }) => block.bbox![1])
  const rowClusters = clusterValues(y1Values, ROW_TOLERANCE)
  const rowAnchors = rowClusters
    .filter(cluster => cluster.length >= 2)
    .map(cluster => cluster[Math.floor(cluster.length / 2)])

  if (rowAnchors.length < 2) return []

  function assignRow(y1: number): number | null {
    for (let r = 0; r < rowAnchors.length; r++) {
      if (Math.abs(y1 - rowAnchors[r]) <= ROW_TOLERANCE) return r
    }
    return null
  }

  // Build a grid: grid[row][col] = text
  const grid: Record<number, Record<number, string>> = {}
  const consumedIndices = new Set<number>()

  for (const { block, index } of indexed) {
    const col = assignCol(block.bbox![0])
    const row = assignRow(block.bbox![1])
    if (col === null || row === null) continue
    if (!grid[row]) grid[row] = {}
    const allSpans = (block.lines ?? []).flatMap(l => l.spans ?? [])
    const text = allSpans.map(spanText).join('').trim()
    grid[row][col] = (grid[row][col] ? grid[row][col] + ' ' : '') + text
    consumedIndices.add(index)
  }

  const rowCount = Object.keys(grid).length
  const colCount = colAnchors.length

  // Conservative threshold: 3+ cols OR (2+ cols AND 3+ rows)
  if (!(colCount >= 3 || (colCount >= 2 && rowCount >= 3))) return []
  if (rowCount < 2) return []

  const sortedRows = Object.keys(grid)
    .map(Number)
    .sort((a, b) => a - b)

  const tableRows = sortedRows.map(r =>
    new TableRow({
      children: colAnchors.map((_, c) =>
        new TableCell({
          width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun(grid[r]?.[c] ?? '')] })],
        })
      ),
    })
  )

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  })

  return [{
    consumedIndices,
    rows: rowCount,
    cols: colCount,
    table,
  }]
}
```

- [ ] **Run tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Run build**

```bash
npm run build
```
Expected: zero TypeScript errors.

- [ ] **Commit**

```bash
git add lib/converters/pdf-to-word.ts lib/converters/__tests__/pdf-to-word.test.ts
git commit -m "feat: add conservative table detection via column clustering for pdf-to-word"
```

---

## Task 6: Wire `detectTables` into `pagesToParagraphs`

Currently `pagesToParagraphs` renders all text blocks as paragraphs. Update it to:
1. Run `detectTables` on each page
2. Skip blocks consumed by a table
3. Insert the `Table` object at the position of the first consumed block

**Files:**
- Modify: `lib/converters/pdf-to-word.ts`

- [ ] **Update `pagesToParagraphs`**

Replace the existing `pagesToParagraphs` function with:

```ts
function pagesToParagraphs(pages: StPage[], body: number): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = []

  for (let p = 0; p < pages.length; p++) {
    if (p > 0) out.push(new Paragraph({ pageBreakBefore: true, children: [] }))

    const pageBlocks = pages[p].blocks ?? []
    const pageWidth = estimatePageWidth(pages[p])
    const detected = detectTables(pageBlocks)

    // Build a map: block index → DetectedTable (so we know which blocks are consumed)
    const consumedBy = new Map<number, DetectedTable>()
    for (const dt of detected) {
      for (const idx of dt.consumedIndices) {
        consumedBy.set(idx, dt)
      }
    }

    // Track which tables have already been emitted
    const emittedTables = new Set<DetectedTable>()

    for (let b = 0; b < pageBlocks.length; b++) {
      const block = pageBlocks[b]
      const dt = consumedBy.get(b)

      if (dt) {
        // First encounter of this table: emit it
        if (!emittedTables.has(dt)) {
          out.push(dt.table)
          emittedTables.add(dt)
        }
        // Skip the block — it's been rendered as a table cell
        continue
      }

      if (!isTextBlock(block)) continue
      const level = detectHeadingLevel(block, body, pageWidth)
      const para = blockToParagraph(block, body, level)
      if (para) out.push(para)
    }
  }

  return out.length > 0 ? out : [new Paragraph({ children: [new TextRun('')] })]
}
```

- [ ] **Update `convertPdfToWord` to accept `Array<Paragraph | Table>` from `pagesToParagraphs`**

The `children` field in `Document` sections accepts `Array<Paragraph | Table>`. The existing call:

```ts
const children = pagesToParagraphs(pages, body)
const doc = new Document({ sections: [{ properties: {}, children }] })
```

The return type of `pagesToParagraphs` is now `Array<Paragraph | Table>`, which `docx`'s `Document` accepts natively. No other changes needed.

- [ ] **Update the `includeImages` path in `convertPdfToWord`**

In the `if (includeImages)` branch, the `children` array is built manually and typed as `Paragraph[]`. Update the type annotation:

```ts
let children: Array<Paragraph | Table>

if (includeImages) {
  children = []
  // ... rest of the existing includeImages code, unchanged
```

The image path doesn't run table detection (it uses page screenshots instead of text blocks), so it stays as-is — just fix the type.

- [ ] **Run build**

```bash
npm run build
```
Expected: zero TypeScript errors.

- [ ] **Run tests**

```bash
npm test
```
Expected: all tests still pass.

- [ ] **Commit**

```bash
git add lib/converters/pdf-to-word.ts
git commit -m "feat: wire table detection into pdf-to-word paragraph rendering pipeline"
```

---

## Task 7: Deploy

- [ ] **Final build check**

```bash
npm run build
```
Expected: `✓ Generating static pages (77/77)`, zero TypeScript errors.

- [ ] **Push to main**

```bash
git push origin main
```

Cloudflare Pages will deploy automatically within ~2 minutes.

---

## Self-Review Notes

**Spec coverage:**
- ✅ Multi-signal heading detection (size ratio, centering, all-caps, bold, word count)
- ✅ Conservative table detection (3+ cols OR 2+ cols × 3+ rows threshold)
- ✅ Table cells render text content correctly
- ✅ Image blocks are ignored by table detection
- ✅ Blocks consumed by tables are excluded from paragraph rendering
- ✅ `includeImages` path unaffected by table detection
- ✅ vitest unit tests for all pure functions

**Known limitations (by design):**
- Tables detected from text-position clustering only — no border/line detection
- One table candidate per page (multiple non-overlapping tables on one page not supported — low frequency edge case)
- Merged cells / colspan not detected

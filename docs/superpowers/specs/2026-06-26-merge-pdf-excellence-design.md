# Merge PDF Excellence — Design Spec

**Date:** 2026-06-26
**Scope:** `app/(tools)/merge-pdf/page.tsx`, `lib/converters/pdf.ts`, `content/tools/merge-pdf.ts`

---

## Problem

The current Merge PDF tool works at file level only: users can reorder files and remove files, but they cannot see what's inside each PDF before merging and cannot exclude individual pages. Every competitor charges for page-level control (iLovePDF, SmallPDF, Adobe Acrobat Pro). ConvertYard will offer it free, in-browser.

---

## Solution

Page-level control with expandable per-file thumbnail grids. Each file row expands to reveal page thumbnails. Users can reorder pages within each file by dragging, and exclude individual pages by clicking ✕. Thumbnails render progressively in the background at 72 DPI using the existing `renderPagePng` pipeline.

---

## Data Model

Replace `files: File[]` state with:

```typescript
interface PdfFileEntry {
  file: File
  pageCount: number | null       // null while loading
  thumbnails: (string | null)[]  // blob URLs; null = still rendering
  pageOrder: number[]            // 0-based page indices in user-chosen order
                                 // excluded pages are absent from this array
  expanded: boolean
}
```

`pageOrder` initialises as `[0, 1, 2, ..., N-1]`. Excluding page 2 removes `2` from the array. Re-including appends it. Dragging reorders entries. This is the single source of truth for what goes into the merge.

### Thumbnail lifecycle

When a file is added:
1. `getPageCount(buffer)` → set `pageCount`, initialise `thumbnails: new Array(N).fill(null)`, `pageOrder: [0..N-1]`
2. Render pages sequentially in the background: `renderPagePng(buffer, p, 72)` → `URL.createObjectURL(blob)` → set `thumbnails[p]`
3. State updates after each thumbnail so the grid fills in progressively

When a file is removed: revoke all blob URLs for that entry (`URL.revokeObjectURL`) before dropping from state.

---

## UI

### File list row (additions to existing)

```
[grip] filename.pdf          [12 pages]  [4.2 MB]  [chevron ↓]  [✕]
```

- **Page count badge**: `12 pages` — shows `…` while `pageCount` is null
- **Expand chevron**: toggles `expanded` on the entry. Rotates 180° when open.

### Expanded page grid

Inline below the file row (not a modal). 4-column CSS grid, ~80px thumbnails.

Each thumbnail cell:
- Rendered page image (or a grey skeleton while `thumbnails[p]` is null)
- Page number label bottom-left (1-based)
- ✕ button top-right — on click: removes that page index from `pageOrder`
- **Excluded state**: thumbnail dimmed to 30% opacity, ✕ becomes `+`, clicking re-appends the page index to `pageOrder`

Within-file page drag: same HTML5 drag API as file-level. `dragPageRef` tracks `{ fileIdx, fromPageOrderIdx }`. `onDragOver` splices within `pageOrder` for that file entry.

### Footer bar

Always visible once files are loaded (replaces the `Drag rows…` hint):

```
3 files · 28 of 34 pages selected
```

Computed from `entries.reduce(...)` — total included pages vs total pages.

### Merge button

```
Merge 28 pages   (instead of "Merge 3 files")
```

Count = sum of `entry.pageOrder.length` across all entries.

### Done state

```
merged.pdf · 28 pages · 4.2 MB
```

Page count = sum of included pages (known from state, no re-read needed).

---

## Converter

### New interface and updated signature

In `lib/converters/pdf.ts`:

```typescript
export interface MergeSource {
  file: File
  pageIndices: number[]  // 0-based, in the order to include them
}

export async function mergePDFs(
  sources: MergeSource[],
  _options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]>
```

### Implementation change

Replace `srcDoc.getPageIndices()` with `source.pageIndices`:

```typescript
const copied = await merged.copyPages(srcDoc, source.pageIndices)
```

`copyPages` already accepts arbitrary index arrays — this is the only change to the merge logic.

### ToolConfig `convertFn` compatibility

`content/tools/merge-pdf.ts` has a `convertFn: mergePDFs` field. Since this tool uses a custom `page.tsx` and never routes through ToolShell's generic conversion path, `convertFn` is never called at runtime. Replace it with a stub that satisfies the type but makes the situation clear:

```typescript
// This tool uses a custom page.tsx — convertFn is never called through ToolShell.
convertFn: () => Promise.resolve([]),
```

---

## Files Changed

| File | Change |
|------|--------|
| `lib/converters/pdf.ts` | Export `MergeSource` interface; update `mergePDFs` to accept `MergeSource[]` |
| `app/(tools)/merge-pdf/page.tsx` | New `PdfFileEntry` state; thumbnail loading; expandable page grid; per-page exclude/reorder; updated footer, merge button, done state |
| `content/tools/merge-pdf.ts` | Update FAQ to reflect page-level control; update `convertFn` to unreachable stub |

---

## What Does NOT Change

- `mupdf-client.ts` — no changes
- ToolShell — no changes
- Any other converter or tool page
- File-level drag-to-reorder — stays as-is alongside the new page-level controls

---

## Edge Cases

- **0-page PDF**: `getPageCount` returns 0 → `pageOrder: []`. File appears in list but contributes no pages. Footer shows `0 of 0 pages`. Merge still works (copyPages with empty array = no pages from that source).
- **All pages excluded from a file**: valid — the file contributes nothing to the merged output. No error.
- **Single file with all pages included**: identical output to today's behaviour.
- **Very large PDF (100+ pages)**: thumbnails render progressively; UI is usable while rendering continues. No blocking.
- **File removed while thumbnails still rendering**: revoke completed blob URLs immediately; rendering of remaining pages should be abandoned. Implementation: track a `cancelled` flag per entry that the render loop checks before each page.

---

## FAQ Updates (`content/tools/merge-pdf.ts`)

Add/update:
- **Can I merge only specific pages?** Yes — expand any file in the list to see its pages, then click ✕ on any page to exclude it from the merge.
- **Can I reorder pages from different files?** You can reorder pages within each file. To interleave pages from different sources, reorder the files first, then use page-level controls within each file.
- Remove or update any FAQ that implied "whole files only".

---

## Testing

- Add one text PDF → page count appears, thumbnails render progressively
- Exclude a page → footer count decrements, excluded page is dimmed
- Re-include a page → page appended to end of that file's order, footer updates
- Drag to reorder pages within a file → pageOrder updates, merge reflects new order
- Merge with exclusions → output has correct page count and order
- Remove a file → blob URLs revoked (check memory in DevTools), footer updates
- `npm run build` passes

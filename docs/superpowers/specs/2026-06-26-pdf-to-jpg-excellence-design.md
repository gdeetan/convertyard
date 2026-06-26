# PDF to JPG Excellence — Design Spec

**Date:** 2026-06-26
**Scope:** `app/(tools)/pdf-to-jpg/page.tsx`, `content/tools/pdf-to-jpg.ts`

---

## Problem

The current PDF to JPG tool uses ToolShell and exports all pages of every dropped PDF. Users who want only specific pages must use Split PDF first — a workaround the FAQ explicitly acknowledges. The DPI and quality sliders give no feedback on what the output will look like, so users guess and re-convert.

---

## Solution

Custom page with two new capabilities:

1. **Page selection** — expandable per-file thumbnail grids (72 DPI, progressive) with checkboxes. All pages selected by default. Unchecking excludes a page from the export.
2. **Click-to-preview** — clicking any thumbnail renders that page at the current DPI/quality settings in an inline preview panel. Changing DPI or quality re-renders the panel automatically (debounced 300ms).

---

## Data Model

```typescript
interface PdfFileEntry {
  id: string                       // stable key: name+size+lastModified+Date.now()
  file: File
  pageCount: number | null         // null while loading
  thumbnails: (string | null)[]    // 72 DPI blob URLs; null = still rendering
  selectedPages: Set<number>       // 0-based; all pages selected by default
  expanded: boolean
}

interface PreviewState {
  fileIdx: number
  pageIndex: number
  blobUrl: string | null           // null while rendering
}
```

### Thumbnail lifecycle

Same pattern as Merge PDF:
1. `getPageCount(buffer)` → set `pageCount`, initialise `thumbnails: new Array(N).fill(null)`, `selectedPages: new Set([0..N-1])`
2. Render pages sequentially: `renderPagePng(buffer, p, 72)` → blob URL → set `thumbnails[p]`
3. `cancelledFiles` ref stops rendering if file is removed mid-render
4. `URL.revokeObjectURL` on all thumbnails when file removed or tool reset

---

## UI

### File list row

```
[chevron ↓]  filename.pdf   [12 pages]  [4.2 MB]  [✕]
```

Expand chevron toggles the thumbnail grid. No grip handle — page order within a file is always sequential for JPG export (no reordering needed).

### Thumbnail grid

4-column grid, inline below the file row. Each cell:
- 72 DPI page image (grey skeleton while rendering)
- Page number label bottom-left (1-based)
- Checkbox top-left — checked = included, unchecked = excluded (dimmed to 30% opacity)
- Clicking the image opens the preview panel for that page

### Preview panel

Renders inline below the thumbnail grid (not a modal):

```
Page 3                              [×]
[full-res JPG image — loading skeleton while rendering]
150 DPI · 85 quality · 420 KB
```

- Opens when user clicks any thumbnail
- Shows page number, rendered image, and size of the rendered output
- Re-renders automatically (debounced 300ms) when DPI preset or quality slider changes
- Previous blob URL revoked before new one is set
- ✕ closes the panel

### DPI + Quality controls

Placed above the Convert button, always visible once files are loaded:

**DPI** — three preset buttons (not a slider):
- `72` (screen / preview)
- `150` (web / email) — default, highlighted
- `300` (print quality)

**Quality** — slider 1–100, default 85, with hint text

### Footer + Convert button

```
3 files · 18 of 34 pages selected
```

```
Convert 18 pages   →   JPG
```

Convert button disabled when 0 pages selected.

### Done state

```
18 JPGs ready · 4.2 MB total
[Download ZIP]
```

List of output files is not shown individually (can be 100+). Just total count + size.

---

## Output

- Page naming: if only 1 page selected from a PDF → `report.jpg`. Multiple pages → `report-page-2.jpg`, `report-page-5.jpg` (original 1-based page numbers, not renumbered sequentially).
- All output files packaged into a single ZIP via `fflate`.
- The page component calls `renderPage(buffer, pageIndex, dpi, quality)` directly for each selected page — no changes to `pdfToJpg` converter.

---

## Files Changed

| File | Change |
|------|--------|
| `app/(tools)/pdf-to-jpg/page.tsx` | Full rewrite — custom page with `PdfFileEntry` state, thumbnail grid with checkboxes, click-to-preview panel, DPI presets, quality slider, ZIP output |
| `content/tools/pdf-to-jpg.ts` | Remove `options` array (controls now in page); stub `convertFn`; update FAQ to remove "use Split PDF first" workaround; add FAQ for page selection and preview |

`lib/converters/pdf.ts` — no changes.

---

## What Does NOT Change

- `mupdf-client.ts` — no changes
- `lib/converters/pdf.ts` — no changes
- ToolShell — no changes
- PDF to PNG — out of scope

---

## Edge Cases

- **0-page PDF**: `pageCount === 0`, `selectedPages` is empty. File appears in list, contributes nothing. Footer shows correct count.
- **All pages deselected**: Convert button disabled. No export.
- **Single-page PDF**: One thumbnail, selected by default. Preview opens automatically on expand (or on first click).
- **File removed while thumbnails rendering**: `cancelledFiles` stops the loop; all completed blob URLs revoked.
- **100+ page PDF**: Thumbnails render progressively; preview renders on demand only.
- **Preview during convert**: Convert is synchronous from the user's perspective (button shows progress). Preview panel stays visible but is not interactive during conversion.

---

## FAQ Updates (`content/tools/pdf-to-jpg.ts`)

Remove:
- "Can I convert just one page?" → remove the "use Split PDF first" answer; replace with: "Yes — expand any file to see its pages, then uncheck the pages you don't need."

Add:
- **Can I preview what the output will look like?** Click any page thumbnail to see a full-resolution preview at your chosen DPI and quality settings. Change the sliders to see the effect in real time.
- **How are the output files named?** Each JPG uses your original PDF name plus the original page number — for example, page 3 of `report.pdf` exports as `report-page-3.jpg`.

Update:
- "How does a multi-page PDF export?" — update to reflect that only selected pages export.

---

## Testing

- Drop a multi-page PDF → thumbnails render progressively; all pages checked by default
- Uncheck a page → footer count decrements; Convert button count updates
- Click a thumbnail → preview panel opens with loading skeleton, then full-res image
- Change DPI preset → preview re-renders at new DPI; size label updates
- Change quality slider → preview re-renders after 300ms debounce; size label updates
- Convert with some pages unchecked → ZIP contains only checked pages with correct naming
- Remove file while thumbnails rendering → rendering stops; no console errors
- `npm run build` passes

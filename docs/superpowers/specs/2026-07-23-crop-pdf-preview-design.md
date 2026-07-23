# Design: Crop PDF Preview Panel

**Date:** 2026-07-23  
**Status:** Approved

## Overview

Add a live crop preview to the crop-pdf tool. After the user drops a PDF, the first 1–4 pages render as thumbnails with a red-shaded overlay showing exactly which margins will be removed. The overlay updates in real time as the user adjusts the margin settings below it.

## Visual Design

- **Style:** Shaded crop zones (Option A). Four red-tinted overlays cover the top/right/bottom/left margins being removed. Each overlay has a dashed inner border (`border: 1.5px dashed rgba(239,68,68,0.6)`) and a semi-transparent fill (`background: rgba(239,68,68,0.22)`).
- **Layout:** Equal-size thumbnail row (Option A). Up to 4 page thumbnails arranged horizontally with `gap-3`. Each thumbnail is `relative`-positioned with an absolute aspect ratio matching the page.
- **Explainer:** An amber note below the row — *"These settings apply to all pages in the document."*
- **Loading state:** Skeleton placeholder divs matching the expected thumbnail dimensions while mupdf renders.
- **Edge cases:** If the PDF has fewer than 4 pages, show only the pages that exist. No empty slots.

## Architecture

### Component: `CropPdfPreview`

**File:** `components/tool-shell/crop-pdf-preview.tsx`

**Interface:** `interactivePanel` slot in `ToolConfig`:
```ts
interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}
```

**Rendering flow:**

1. On first render (when `files[0]` appears), read `files[0].arrayBuffer()`.
2. Call `getPageSizes(buffer)` → get `{ width, height }[]` in PDF points for all pages.
3. Call `renderPagePng(buffer, pageIndex, 72, false)` for pages 0–3 (capped at actual page count). DPI 72 is sufficient for thumbnail display.
4. Convert each PNG `ArrayBuffer` to an object URL via `URL.createObjectURL(new Blob([buf], { type: 'image/png' }))`.
5. Display each page in an `<img>` with the crop overlay divs on top.

**Overlay calculation:**

Convert mm values to a percentage of the page dimensions (using PDF points where 1mm = 2.8346pt):

```ts
const MM_TO_PT = 2.8346
const leftPct   = (leftMm   * MM_TO_PT) / pageWidthPt  * 100
const rightPct  = (rightMm  * MM_TO_PT) / pageWidthPt  * 100
const topPct    = (topMm    * MM_TO_PT) / pageHeightPt * 100
const bottomPct = (bottomMm * MM_TO_PT) / pageHeightPt * 100
```

Each of the four overlay divs is absolutely positioned using these percentages as `left`, `right`, `top`, `bottom` + matching `width`/`height`.

**Preset resolution** (mirrors `cropPdf` logic):

```ts
const preset = options.preset as string ?? '10mm'
let topMm = 10, rightMm = 10, bottomMm = 10, leftMm = 10
if (preset === 'custom') {
  topMm    = (options.topMm    as number) ?? 10
  rightMm  = (options.rightMm  as number) ?? 10
  bottomMm = (options.bottomMm as number) ?? 10
  leftMm   = (options.leftMm   as number) ?? 10
} else {
  const mm = parseFloat(preset)
  if (!isNaN(mm)) topMm = rightMm = bottomMm = leftMm = mm
}
```

**Reactivity:** The component receives `options` as a prop, which ToolShell already updates on every `handleOptionChange`. React re-renders the overlay percentages with each change. No mupdf re-render is needed — only the overlay divs change.

**Object URL cleanup:** `useEffect` cleanup returns `URL.revokeObjectURL` for all created URLs on unmount or when `files[0]` changes.

**No re-render on additional files:** The preview is keyed to `files[0]`. Adding more files to the batch does not change the reference page.

### Config change: `content/tools/crop-pdf.ts`

Add `interactivePanel`:

```ts
import { CropPdfPreview } from '@/components/tool-shell/crop-pdf-preview'

export const config: ToolConfig = {
  // ...existing config...
  interactivePanel: CropPdfPreview,
}
```

## Files Changed

| File | Change |
|------|--------|
| `components/tool-shell/crop-pdf-preview.tsx` | New component |
| `content/tools/crop-pdf.ts` | Add `interactivePanel: CropPdfPreview` |

## What This Does NOT Include

- Drag-to-resize crop handles (conflicts with the OptionsPanel controls)
- Page navigation beyond page 4
- Preview for files beyond `files[0]`
- Preview during or after conversion (existing ToolShell flow handles result display)

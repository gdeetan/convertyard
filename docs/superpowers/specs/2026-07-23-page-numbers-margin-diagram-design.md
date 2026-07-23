# Design: Page Numbers — Margin Slider + Position Diagram

**Date:** 2026-07-23  
**Status:** Approved

## Problem

The `addPageNumbers` converter hardcodes 30pt margin from the page edge. PDFs with content near the edge get page numbers stamped over their text, with no user control to fix it.

## Solution

Add a `margin` slider option and a live position diagram so users can see and control where the page number lands before converting.

---

## Changes

### 1. `content/tools/page-numbers.ts`

Add two new options to the `options` array, inserted after the `position` radio and before the `fontSize` slider:

**Position diagram** (new option type, read-only):
```ts
{
  type: 'position-diagram',
  name: 'positionDiagram',  // name required by ToolOption union but unused
  label: '',
}
```

**Margin slider:**
```ts
{
  type: 'slider',
  name: 'margin',
  label: 'Margin from edge (pt)',
  min: 10,
  max: 100,
  step: 5,
  default: 30,
  hint: '30 pt is the default. Increase if your PDF has content near the edges.',
}
```

Final options order:
1. `format` (radio) — unchanged
2. `position` (radio) — unchanged
3. `positionDiagram` (position-diagram) — new
4. `margin` (slider) — new
5. `fontSize` (slider) — unchanged
6. `startNumber` (number) — unchanged

---

### 2. New `PositionDiagram` component

**File:** `components/tool-shell/position-diagram.tsx`

A pure CSS component. No WASM, no PDF rendering.

**Appearance:**
- Page rectangle: ~100×130px, light gray background, subtle border, rounded corners
- A small pill/label showing the format text (e.g., "Page 1 of 12") positioned inside the rectangle
- The pill's position (top/bottom, left/center/right) mirrors the selected `position` value
- The pill's distance from the nearest edge visually scales with `margin` (clamped to a reasonable visual range so it doesn't escape the rectangle)
- Thin dashed lines show the margin distance from the edge

**Props:**
```ts
interface PositionDiagramProps {
  position: string  // 'bottom-center' | 'bottom-right' | etc.
  margin: number    // pt value from slider
}
```

---

### 3. `lib/types.ts` — new ToolOption type

Add `PositionDiagramOption` to the `ToolOption` union:

```ts
export interface PositionDiagramOption {
  type: 'position-diagram'
  name: string
  label: string
  hint?: string
}
```

---

### 4. `components/tool-shell/options-panel.tsx`

Add a case for `type === 'position-diagram'` in the option renderer. Render `<PositionDiagram>` passing `values.position` and `values.margin` from the panel's existing `values` prop. The diagram is always visible (no `dependsOn` needed — it makes no sense without the position radio).

---

### 5. `lib/converters/pdf.ts` — `addPageNumbers()`

Replace the hardcoded margin value `30` with `(options.margin as number) ?? 30`.

The margin is used in two places (y-axis for top/bottom, x-axis for left/right). Both use the same value currently; keep that behavior — uniform margin from all edges.

---

## Non-goals

- No live PDF page rendering (Option C — rejected for WASM overhead)
- No separate horizontal/vertical margin controls
- No font color or font family options (existing FAQ notes these are on the roadmap — out of scope here)

---

## Testing

1. Default behavior unchanged: existing PDFs processed without setting `margin` still get 30pt margin
2. Slider at 10pt: number appears very close to edge
3. Slider at 100pt: number appears well inside the page, away from edge
4. Diagram updates instantly on position and margin change — no lag
5. All 6 position values correctly reposition the diagram pill
6. Batch of 1000 PDFs still completes without regression

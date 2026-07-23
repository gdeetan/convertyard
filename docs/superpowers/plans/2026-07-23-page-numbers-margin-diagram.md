# Page Numbers — Margin Slider + Position Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a margin slider and a live position diagram to the Add Page Numbers tool so users can avoid page numbers overlapping their PDF content.

**Architecture:** Add a `PositionDiagramOption` type to the shared `ToolOption` union, render it inline in `OptionsPanel` as a pure-CSS diagram, and replace the hardcoded `MARGIN = 30` in the converter with the user-supplied value.

**Tech Stack:** TypeScript, React, Tailwind CSS, pdf-lib (existing)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/types.ts` | Modify | Add `PositionDiagramOption` to `ToolOption` union |
| `components/tool-shell/position-diagram.tsx` | Create | Pure-CSS live diagram component |
| `components/tool-shell/options-panel.tsx` | Modify | Render `position-diagram` option type inline |
| `content/tools/page-numbers.ts` | Modify | Add `positionDiagram` + `margin` options |
| `lib/converters/pdf.ts` | Modify | Use `options.margin` instead of hardcoded `30` |

---

## Task 1: Add `PositionDiagramOption` to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts:80-95`

- [ ] **Step 1: Add the new option interface and expand the union**

In `lib/types.ts`, after the `SectionHeaderOption` interface (line 80) and before the `ToolOption` union (line 85), add:

```ts
export interface PositionDiagramOption {
  type: 'position-diagram'
  name: string
  label: string
}
```

Then update the `ToolOption` union to include it:

```ts
export type ToolOption =
  | SliderOption
  | ToggleOption
  | DropdownOption
  | RadioOption
  | NumberOption
  | ColorPickerOption
  | ImageUploadOption
  | NumberWithChipsOption
  | TextInputOption
  | SectionHeaderOption
  | PositionDiagramOption
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add PositionDiagramOption type to ToolOption union"
```

---

## Task 2: Create `PositionDiagram` component

**Files:**
- Create: `components/tool-shell/position-diagram.tsx`

The diagram is a page-shaped rectangle (~100×130px) with an absolutely-positioned label pill that reflects the `position` and `margin` values in real time. No state, no WASM, no side effects.

Scale factor: PDF A4 ≈ 595pt wide, diagram is 100px wide → scale = 100/595 ≈ 0.168. Margin display is clamped so the pill stays inside the rectangle even at extreme values.

- [ ] **Step 1: Create the component file**

Create `components/tool-shell/position-diagram.tsx`:

```tsx
'use client'

interface PositionDiagramProps {
  position: string  // 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
  margin: number    // pt value, 10–100
}

const DIAGRAM_W = 100  // px
const DIAGRAM_H = 130  // px
const PDF_W_PT = 595   // A4 width in pt (reference)
const SCALE = DIAGRAM_W / PDF_W_PT

export function PositionDiagram({ position, margin }: PositionDiagramProps) {
  const marginPx = Math.round(Math.max(2, Math.min(margin * SCALE, 20)))

  const isTop   = position.startsWith('top')
  const isLeft  = position.endsWith('left')
  const isRight = position.endsWith('right')
  const isCenter = !isLeft && !isRight

  const pillStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: '7px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    padding: '2px 4px',
    borderRadius: '3px',
    background: '#3b82f6',
    color: '#fff',
    ...(isTop    ? { top: marginPx }    : { bottom: marginPx }),
    ...(isLeft   ? { left: marginPx }   :
        isRight  ? { right: marginPx }  :
        { left: '50%', transform: 'translateX(-50%)' }),
  }

  const guideStyle = (edge: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    background: '#93c5fd',
    opacity: 0.6,
    ...(edge === 'top'    ? { top: marginPx - 1, left: 0, right: 0, height: 1 } :
        edge === 'bottom' ? { bottom: marginPx - 1, left: 0, right: 0, height: 1 } :
        edge === 'left'   ? { left: marginPx - 1, top: 0, bottom: 0, width: 1 } :
                            { right: marginPx - 1, top: 0, bottom: 0, width: 1 }),
  })

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div
        className="relative overflow-hidden rounded border border-border bg-bg-elevated shadow-sm"
        style={{ width: DIAGRAM_W, height: DIAGRAM_H }}
        aria-label={`Page number position: ${position}, margin: ${margin}pt`}
        role="img"
      >
        {/* Content area lines (simulate text) */}
        {[20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100].map((top) => (
          <div
            key={top}
            className="absolute rounded-full bg-border"
            style={{ top, left: 10, right: 10, height: 2 }}
          />
        ))}

        {/* Margin guide line */}
        <div style={guideStyle(isTop ? 'top' : 'bottom')} />
        {isLeft  && <div style={guideStyle('left')} />}
        {isRight && <div style={guideStyle('right')} />}

        {/* Page number label */}
        <div style={pillStyle}>pg 1</div>
      </div>
      <p className="text-xs text-fg-subtle">{margin}pt from edge</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `position-diagram.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/tool-shell/position-diagram.tsx
git commit -m "feat: add PositionDiagram component for page numbers tool"
```

---

## Task 3: Wire `position-diagram` into `OptionsPanel`

**Files:**
- Modify: `components/tool-shell/options-panel.tsx`

The options panel already receives `values: ToolOptions`. We intercept `position-diagram` options in the `.map()` before they reach `OptionRow`, passing `values.position` and `values.margin` to the diagram.

- [ ] **Step 1: Add the import at the top of `options-panel.tsx`**

After the existing imports (around line 6), add:

```ts
import { PositionDiagram } from './position-diagram'
```

- [ ] **Step 2: Update `isRenderableOption` to also exclude `position-diagram`**

Replace line 10–11:

```ts
function isRenderableOption(opt: ToolOption): opt is RenderableOption {
  return opt.type !== 'section-header'
}
```

with:

```ts
function isRenderableOption(opt: ToolOption): opt is RenderableOption {
  return opt.type !== 'section-header' && opt.type !== 'position-diagram'
}
```

Also update the `RenderableOption` type on line 8:

```ts
type RenderableOption = Exclude<ToolOption, SectionHeaderOption | PositionDiagramOption>
```

And add `PositionDiagramOption` to the import on line 6:

```ts
import type { ToolOption, ToolOptions, NumberWithChipsOption, RadioOption, SectionHeaderOption, PositionDiagramOption } from '@/lib/types'
```

- [ ] **Step 3: Add the `position-diagram` case in the `.map()` inside `OptionsPanel`**

In the `.map()` block (around line 39), after the `section-header` check and before the `OptionRow` return, insert:

```tsx
if (opt.type === 'position-diagram') {
  return (
    <div key="position-diagram" className="py-1">
      <PositionDiagram
        position={(values.position as string) ?? 'bottom-center'}
        margin={(values.margin as number) ?? 30}
      />
    </div>
  )
}
```

The full updated `.map()` block should look like:

```tsx
{options
  .filter((opt) => {
    if (opt.type === 'section-header') return true
    if (opt.type === 'position-diagram') return true
    if (!opt.dependsOn) return true
    return String(values[opt.dependsOn.name]) === opt.dependsOn.value
  })
  .map((opt) => {
    if (opt.type === 'section-header') {
      return (
        <h4
          key={`section-${opt.label}`}
          className="border-t border-border pt-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle first:border-t-0 first:pt-0"
        >
          {opt.label}
        </h4>
      )
    }
    if (opt.type === 'position-diagram') {
      return (
        <div key="position-diagram" className="py-1">
          <PositionDiagram
            position={(values.position as string) ?? 'bottom-center'}
            margin={(values.margin as number) ?? 30}
          />
        </div>
      )
    }
    return (
      <OptionRow
        key={opt.name}
        opt={opt as RenderableOption}
        value={values[opt.name]}
        onChange={onChange}
      />
    )
  })}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/tool-shell/options-panel.tsx
git commit -m "feat: render position-diagram option type in OptionsPanel"
```

---

## Task 4: Add `positionDiagram` and `margin` options to the tool config

**Files:**
- Modify: `content/tools/page-numbers.ts`

- [ ] **Step 1: Add the two new options after the `position` radio**

In `content/tools/page-numbers.ts`, the current `options` array order is:
1. `format` (radio)
2. `position` (radio)
3. `fontSize` (slider)
4. `startNumber` (number)

Insert two new entries between `position` and `fontSize`:

```ts
    {
      type: 'position-diagram',
      name: 'positionDiagram',
      label: '',
    },
    {
      type: 'slider',
      name: 'margin',
      label: 'Margin from edge (pt)',
      min: 10,
      max: 100,
      step: 5,
      default: 30,
      hint: '30 pt is the standard footer margin. Increase if your PDF has content near the edges.',
    },
```

The full `options` array should now be:

```ts
  options: [
    {
      type: 'radio',
      name: 'format',
      label: 'Number format',
      choices: [
        { value: 'N',           label: '1, 2, 3 …' },
        { value: 'Page N',      label: 'Page 1, Page 2 …' },
        { value: 'Page N of T', label: 'Page 1 of 12, Page 2 of 12 …' },
        { value: 'N / T',       label: '1 / 12, 2 / 12 …' },
      ],
      default: 'Page N of T',
    },
    {
      type: 'radio',
      name: 'position',
      label: 'Position',
      choices: [
        { value: 'bottom-center', label: 'Bottom centre' },
        { value: 'bottom-right',  label: 'Bottom right' },
        { value: 'bottom-left',   label: 'Bottom left' },
        { value: 'top-center',    label: 'Top centre' },
        { value: 'top-right',     label: 'Top right' },
        { value: 'top-left',      label: 'Top left' },
      ],
      default: 'bottom-center',
    },
    {
      type: 'position-diagram',
      name: 'positionDiagram',
      label: '',
    },
    {
      type: 'slider',
      name: 'margin',
      label: 'Margin from edge (pt)',
      min: 10,
      max: 100,
      step: 5,
      default: 30,
      hint: '30 pt is the standard footer margin. Increase if your PDF has content near the edges.',
    },
    {
      type: 'slider',
      name: 'fontSize',
      label: 'Font size (pt)',
      min: 6,
      max: 24,
      step: 1,
      default: 10,
      hint: '10 pt is standard for footers. Go larger if printing at small scale.',
    },
    {
      type: 'number',
      name: 'startNumber',
      label: 'Start at page',
      min: 1,
      default: 1,
      hint: 'The number to stamp on the first page. Useful when combining documents.',
    },
  ],
```

Also update the FAQ entry that mentions the hardcoded margin (currently says "30 pt from the edge"):

Find:
```ts
    {
      q: 'Will existing content be covered by the page number?',
      a: 'The number is drawn in the margin area (30 pt from the edge). If your PDF has content that bleeds to the very edge, there is a small risk of overlap — use a different position in that case.',
    },
```

Replace with:
```ts
    {
      q: 'Will existing content be covered by the page number?',
      a: 'The number is drawn at the margin distance you set (default 30 pt from the edge). If your PDF has content near the edge, increase the "Margin from edge" slider to push the number further in.',
    },
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add content/tools/page-numbers.ts
git commit -m "feat: add margin slider and position diagram to page-numbers tool config"
```

---

## Task 5: Use `options.margin` in the converter

**Files:**
- Modify: `lib/converters/pdf.ts:1785`

- [ ] **Step 1: Replace the hardcoded `MARGIN = 30`**

Find line 1785 in `lib/converters/pdf.ts`:

```ts
  const MARGIN = 30
```

Replace with:

```ts
  const MARGIN = typeof options.margin === 'number' ? Math.max(10, Math.min(100, options.margin)) : 30
```

No other lines change — `MARGIN` is already used correctly in the x/y calculations on lines 1812–1817.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/converters/pdf.ts
git commit -m "feat: use options.margin in addPageNumbers instead of hardcoded 30pt"
```

---

## Task 6: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm run dev
```

Open `http://localhost:3000/page-numbers` in a browser.

- [ ] **Step 2: Verify the diagram renders**

- Options panel shows: Format → Position → diagram → Margin slider → Font size → Start at page
- Diagram is a small page rectangle (~100×130px) with a blue pill label and faint guide line
- Pill is at bottom-center by default (default position)

- [ ] **Step 3: Verify diagram updates live**

- Click "Top right" in the Position radio → pill moves to top-right corner immediately
- Drag the Margin slider to 10pt → pill moves very close to the edge, guide line near edge
- Drag the Margin slider to 100pt → pill moves well inside the page

- [ ] **Step 4: Verify converter uses the margin**

- Drop any PDF, set margin to 10pt, convert → page number appears very close to the edge
- Set margin to 80pt, convert → page number appears well inside the page
- Leave margin at default (30pt) → same behavior as before this feature was added

- [ ] **Step 5: Final commit if any polish was needed**

```bash
git add -p
git commit -m "fix: polish position diagram styles"
```

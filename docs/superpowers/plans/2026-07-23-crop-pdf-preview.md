# Crop PDF Preview Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live crop preview to the crop-pdf tool — renders the first 1–4 pages as thumbnails with a red-shaded overlay showing exactly which margins will be removed, updating in real time as the user adjusts settings.

**Architecture:** A new `CropPdfPreview` React component wired into the existing `interactivePanel` slot in `ToolConfig`. It uses `renderPagePng` and `getPageSizes` from the existing `mupdf-client` to render page thumbnails at 72 DPI, then overlays four absolutely-positioned divs whose CSS percentages are computed from the current margin settings. A pure utility module holds the margin-resolution and percentage-calculation logic so it can be unit-tested independently of the React component.

**Tech Stack:** React (useState, useEffect, useRef), mupdf-client (already in codebase), Tailwind CSS, Vitest for unit tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/converters/crop-pdf-preview-utils.ts` | Create | Pure functions: resolve options → mm values, compute overlay percentages |
| `lib/converters/__tests__/crop-pdf-preview-utils.test.ts` | Create | Unit tests for the above |
| `components/tool-shell/crop-pdf-preview.tsx` | Create | React component: renders page thumbnails + crop overlay |
| `content/tools/crop-pdf.ts` | Modify | Wire `interactivePanel: CropPdfPreview` into the config |

---

### Task 1: Margin calculation utilities + tests

**Files:**
- Create: `lib/converters/crop-pdf-preview-utils.ts`
- Create: `lib/converters/__tests__/crop-pdf-preview-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/converters/__tests__/crop-pdf-preview-utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveCropMargins, calcOverlayPct, MM_TO_PT } from '../crop-pdf-preview-utils'

describe('resolveCropMargins', () => {
  it('resolves preset mm string to all four sides', () => {
    expect(resolveCropMargins({ preset: '10mm' })).toEqual(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 }
    )
  })

  it('handles 5mm preset', () => {
    expect(resolveCropMargins({ preset: '5mm' })).toEqual(
      { topMm: 5, rightMm: 5, bottomMm: 5, leftMm: 5 }
    )
  })

  it('handles 15mm and 20mm presets', () => {
    expect(resolveCropMargins({ preset: '15mm' })).toEqual(
      { topMm: 15, rightMm: 15, bottomMm: 15, leftMm: 15 }
    )
    expect(resolveCropMargins({ preset: '20mm' })).toEqual(
      { topMm: 20, rightMm: 20, bottomMm: 20, leftMm: 20 }
    )
  })

  it('uses individual values when preset is custom', () => {
    expect(
      resolveCropMargins({ preset: 'custom', topMm: 5, rightMm: 10, bottomMm: 15, leftMm: 20 })
    ).toEqual({ topMm: 5, rightMm: 10, bottomMm: 15, leftMm: 20 })
  })

  it('defaults to 10 for missing custom values', () => {
    expect(resolveCropMargins({ preset: 'custom' })).toEqual(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 }
    )
  })

  it('defaults to 10mm when preset is missing', () => {
    expect(resolveCropMargins({})).toEqual(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 }
    )
  })
})

describe('calcOverlayPct', () => {
  it('computes correct percentages for an A4 page (595 × 842 pt)', () => {
    const result = calcOverlayPct(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 },
      595,
      842
    )
    expect(result.leftPct).toBeCloseTo((10 * MM_TO_PT) / 595 * 100, 3)
    expect(result.rightPct).toBeCloseTo((10 * MM_TO_PT) / 595 * 100, 3)
    expect(result.topPct).toBeCloseTo((10 * MM_TO_PT) / 842 * 100, 3)
    expect(result.bottomPct).toBeCloseTo((10 * MM_TO_PT) / 842 * 100, 3)
  })

  it('handles asymmetric margins', () => {
    const result = calcOverlayPct(
      { topMm: 5, rightMm: 10, bottomMm: 15, leftMm: 20 },
      595,
      842
    )
    expect(result.topPct).toBeCloseTo((5  * MM_TO_PT) / 842 * 100, 3)
    expect(result.rightPct).toBeCloseTo((10 * MM_TO_PT) / 595 * 100, 3)
    expect(result.bottomPct).toBeCloseTo((15 * MM_TO_PT) / 842 * 100, 3)
    expect(result.leftPct).toBeCloseTo((20 * MM_TO_PT) / 595 * 100, 3)
  })

  it('returns zero percentages when all margins are 0', () => {
    const result = calcOverlayPct({ topMm: 0, rightMm: 0, bottomMm: 0, leftMm: 0 }, 595, 842)
    expect(result).toEqual({ topPct: 0, rightPct: 0, bottomPct: 0, leftPct: 0 })
  })
})
```

- [ ] **Step 2: Run tests — expect them to fail (module not found)**

```bash
npx vitest run lib/converters/__tests__/crop-pdf-preview-utils.test.ts
```

Expected: `Error: Cannot find module '../crop-pdf-preview-utils'`

- [ ] **Step 3: Implement the utility module**

Create `lib/converters/crop-pdf-preview-utils.ts`:

```ts
import type { ToolOptions } from '@/lib/types'

export const MM_TO_PT = 2.8346

export interface CropMarginsMm {
  topMm: number
  rightMm: number
  bottomMm: number
  leftMm: number
}

export interface CropOverlayPct {
  topPct: number
  rightPct: number
  bottomPct: number
  leftPct: number
}

export function resolveCropMargins(options: ToolOptions): CropMarginsMm {
  const preset = (options.preset as string) ?? '10mm'
  if (preset === 'custom') {
    return {
      topMm:    typeof options.topMm    === 'number' ? options.topMm    : 10,
      rightMm:  typeof options.rightMm  === 'number' ? options.rightMm  : 10,
      bottomMm: typeof options.bottomMm === 'number' ? options.bottomMm : 10,
      leftMm:   typeof options.leftMm   === 'number' ? options.leftMm   : 10,
    }
  }
  const mm = parseFloat(preset)
  const value = isNaN(mm) ? 10 : mm
  return { topMm: value, rightMm: value, bottomMm: value, leftMm: value }
}

export function calcOverlayPct(
  margins: CropMarginsMm,
  pageWidthPt: number,
  pageHeightPt: number
): CropOverlayPct {
  return {
    topPct:    (margins.topMm    * MM_TO_PT) / pageHeightPt * 100,
    rightPct:  (margins.rightMm  * MM_TO_PT) / pageWidthPt  * 100,
    bottomPct: (margins.bottomMm * MM_TO_PT) / pageHeightPt * 100,
    leftPct:   (margins.leftMm   * MM_TO_PT) / pageWidthPt  * 100,
  }
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npx vitest run lib/converters/__tests__/crop-pdf-preview-utils.test.ts
```

Expected: all 9 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/crop-pdf-preview-utils.ts lib/converters/__tests__/crop-pdf-preview-utils.test.ts
git commit -m "feat: add crop-pdf margin utility functions with tests"
```

---

### Task 2: CropPdfPreview component

**Files:**
- Create: `components/tool-shell/crop-pdf-preview.tsx`

- [ ] **Step 1: Create the component**

Create `components/tool-shell/crop-pdf-preview.tsx`:

```tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { renderPagePng, getPageSizes } from '@/lib/converters/mupdf-client'
import { resolveCropMargins, calcOverlayPct } from '@/lib/converters/crop-pdf-preview-utils'
import type { ToolOptions } from '@/lib/types'

const MAX_PREVIEW_PAGES = 4
const PREVIEW_DPI = 72
const THUMBNAIL_WIDTH = 96

interface PageData {
  url: string
  widthPt: number
  heightPt: number
}

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

export function CropPdfPreview({ files, options }: Props) {
  const [pages, setPages] = useState<PageData[]>([])
  const [loading, setLoading] = useState(false)
  const urlsRef = useRef<string[]>([])
  const firstFile = files[0]

  useEffect(() => {
    if (!firstFile) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setPages([])
      for (const u of urlsRef.current) URL.revokeObjectURL(u)
      urlsRef.current = []

      const buffer = await firstFile.arrayBuffer()
      const sizes = await getPageSizes(buffer)
      const count = Math.min(sizes.length, MAX_PREVIEW_PAGES)

      const loaded: PageData[] = []
      for (let i = 0; i < count; i++) {
        if (cancelled) return
        const png = await renderPagePng(buffer, i, PREVIEW_DPI, false)
        const url = URL.createObjectURL(new Blob([png], { type: 'image/png' }))
        urlsRef.current.push(url)
        loaded.push({ url, widthPt: sizes[i].width, heightPt: sizes[i].height })
      }

      if (!cancelled) {
        setPages(loaded)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [firstFile])

  useEffect(() => {
    return () => {
      for (const u of urlsRef.current) URL.revokeObjectURL(u)
    }
  }, [])

  const margins = resolveCropMargins(options)

  if (loading) {
    return (
      <div className="flex gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 w-24 animate-pulse rounded bg-bg-muted" />
        ))}
      </div>
    )
  }

  if (pages.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {pages.map((page, i) => {
          const overlay = calcOverlayPct(margins, page.widthPt, page.heightPt)
          const thumbHeight = Math.round(THUMBNAIL_WIDTH * page.heightPt / page.widthPt)
          return (
            <div
              key={i}
              className="relative shrink-0 overflow-hidden rounded border border-border"
              style={{ width: THUMBNAIL_WIDTH, height: thumbHeight }}
            >
              <img
                src={page.url}
                alt={`Page ${i + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0">
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${overlay.topPct}%`, background: 'rgba(239,68,68,0.22)', borderBottom: '1.5px dashed rgba(239,68,68,0.6)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${overlay.bottomPct}%`, background: 'rgba(239,68,68,0.22)', borderTop: '1.5px dashed rgba(239,68,68,0.6)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${overlay.leftPct}%`, background: 'rgba(239,68,68,0.22)', borderRight: '1.5px dashed rgba(239,68,68,0.6)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${overlay.rightPct}%`, background: 'rgba(239,68,68,0.22)', borderLeft: '1.5px dashed rgba(239,68,68,0.6)' }} />
              </div>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] leading-none text-white">
                p.{i + 1}
              </span>
            </div>
          )
        })}
      </div>
      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        These settings apply to all pages in the document.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any type errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add components/tool-shell/crop-pdf-preview.tsx
git commit -m "feat: add CropPdfPreview component with red crop-zone overlay"
```

---

### Task 3: Wire preview into crop-pdf config

**Files:**
- Modify: `content/tools/crop-pdf.ts`

- [ ] **Step 1: Add `interactivePanel` to the config**

In `content/tools/crop-pdf.ts`, add the import at the top (after the existing imports):

```ts
import { CropPdfPreview } from '@/components/tool-shell/crop-pdf-preview'
```

Then add `interactivePanel` inside the `config` object, after `enablePresets: true,`:

```ts
  interactivePanel: CropPdfPreview,
```

The top of the file should now look like:

```ts
import { cropPdf } from '@/lib/converters/pdf'
import { CropPdfPreview } from '@/components/tool-shell/crop-pdf-preview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'crop-pdf',
  title: 'Crop PDF Pages',
  subtitle: 'Trim margins off every page. Batch-friendly — all processing happens in your browser.',
  bestFor: 'Best for removing excessive whitespace from scanned documents or reducing margins before printing.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: cropPdf,
  enablePresets: true,
  interactivePanel: CropPdfPreview,
  // ...rest unchanged
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Start dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:3000/crop-pdf` in a browser.

Manual checklist:
- [ ] Empty state: no preview visible (just the dropzone)
- [ ] Drop a multi-page PDF: loading skeleton appears briefly, then 1–4 thumbnails render
- [ ] Change preset from "10mm" to "20mm": red overlay zones visibly grow on all thumbnails
- [ ] Switch to "Custom margins": set different values per side, verify each overlay edge updates independently
- [ ] Drop a single-page PDF: only one thumbnail shown, no empty slots
- [ ] Dark mode (if enabled): amber note renders correctly

- [ ] **Step 5: Commit**

```bash
git add content/tools/crop-pdf.ts
git commit -m "feat: wire CropPdfPreview into crop-pdf tool as interactivePanel"
```

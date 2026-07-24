# Header/Footer — Page Expansion + Custom Text Design Spec

**Date:** 2026-07-24
**Tool:** `header-footer` (`/header-footer`)
**Status:** Approved

## Problem

1. When a PDF has content that fills the page edge-to-edge, the header/footer text overlaps it. The current margin control moves the text closer/further from the edge but the page itself doesn't grow — the overlap problem persists.
2. Users can only choose preset header/footer text (CONFIDENTIAL, DRAFT, page numbers, date). There is no way to enter a custom string.

## Goal

- **Page expansion:** Opt-in toggle that physically extends the PDF page boundaries by the margin amount, guaranteeing zero overlap between header/footer text and existing content.
- **Custom text:** "Other…" option in each dropdown that reveals a free-text input for arbitrary header/footer content.

---

## Feature 1: Page Expansion

### Option

New `expandPage` toggle added to `content/tools/header-footer.ts` after the `fontSize` slider:

```ts
{
  type: 'toggle' as const,
  name: 'expandPage',
  label: 'Expand page to fit',
  default: false,
}
```

### Converter logic (`lib/converters/pdf-tier3.ts`)

Read from options: `const expandPage = options.expandPage === true`

Before drawing text on each page, when `expandPage` is true:

1. Save `originalHeight = height` (from `page.getSize()`)
2. Calculate expansions:
   ```ts
   const headerExpansion = headerTemplate.trim() ? headerMargin : 0
   const footerExpansion = footerTemplate.trim() ? footerMargin : 0
   ```
3. Resize the MediaBox outward:
   ```ts
   page.setMediaBox(0, -footerExpansion, width, originalHeight + headerExpansion)
   ```
   - Existing content (at y=0 to y=originalHeight) is untouched
   - New blank band at top: y=originalHeight to y=originalHeight+headerExpansion
   - New blank band at bottom: y=-footerExpansion to y=0

4. Use expansion-aware y-position formulas inside `drawLabel`:
   - Header (expansion on): `y = originalHeight + (headerMargin - fontSize) / 2`
   - Footer (expansion on): `y = -(footerMargin + fontSize) / 2`
   - Both expansion off: existing formulas unchanged (`y = height - headerMargin - fontSize` for header, `y = footerMargin` for footer)

> When `expandPage` is false, behaviour is identical to the current implementation.

### Preview update (`components/tool-shell/header-footer-preview.tsx`)

When `expandPage` is true, blue bands render as **stacked divs above/below the thumbnail** (not absolute overlays on top of it), to show that these are new whitespace zones being added to the page:

```
┌─────────────────┐  ← header blue band (above img)
│ HEADER TEXT     │
├─────────────────┤
│                 │
│   page img      │
│                 │
├─────────────────┤
│ FOOTER TEXT     │  ← footer blue band (below img)
└─────────────────┘
```

When `expandPage` is false, existing overlay behaviour is preserved (bands overlap the thumbnail).

Band heights remain proportional: `(headerMargin / pageHeightPt) * 100%` of the thumbnail height (same scale factor as before, applied as a pixel height).

---

## Feature 2: Custom Text

### `showIf` conditional option visibility

Add optional field to `BaseOption` in `lib/types.ts`:

```ts
showIf?: { name: string; value: unknown }
```

In `components/tool-shell/options-panel.tsx`, skip rendering an `OptionRow` when its `showIf` condition is not met:

```ts
if (opt.showIf && options[opt.showIf.name] !== opt.showIf.value) return null
```

### Dropdown changes

Add `{ value: 'custom', label: 'Other…' }` as the last choice in both `headerText` and `footerText` dropdowns.

### New options

Two new text inputs added to `content/tools/header-footer.ts`, each after their respective dropdown:

```ts
{
  type: 'text' as const,
  name: 'headerCustomText',
  label: 'Custom header text',
  placeholder: 'e.g. Company Name',
  default: '',
  showIf: { name: 'headerText', value: 'custom' },
},
{
  type: 'text' as const,
  name: 'footerCustomText',
  label: 'Custom footer text',
  placeholder: 'e.g. Confidential — Do Not Distribute',
  default: '',
  showIf: { name: 'footerText', value: 'custom' },
},
```

### Converter logic

When `headerText === 'custom'`, use `headerCustomText` as the template instead:

```ts
const headerTemplate = options.headerText === 'custom'
  ? (options.headerCustomText as string) ?? ''
  : (options.headerText as string) ?? ''
```

Same pattern for footer. The resolved template still passes through `resolveText`, so `{page}`, `{total}`, and `{date}` tokens work in custom text.

### Preview update

When `headerText === 'custom'`, resolve the band label from `options.headerCustomText`. Same for footer.

---

## Options order (final)

```
headerText (dropdown, includes 'Other…')
headerCustomText (text, showIf: headerText === 'custom')
headerMargin (number-with-presets)
footerText (dropdown, includes 'Other…')
footerCustomText (text, showIf: footerText === 'custom')
footerMargin (number-with-presets)
alignment (radio)
fontSize (slider)
expandPage (toggle)
```

---

## FAQ update

Add one new FAQ entry:

```
Q: What does "Expand page to fit" do?
A: When enabled, the tool physically grows each page by the margin amount — adding blank whitespace above for the header and below for the footer. This guarantees the stamped text never overlaps existing content, even in PDFs that fill the page edge-to-edge. The page dimensions of the output will be slightly larger than the original.
```

---

## Files Affected

| File | Change |
|------|--------|
| `lib/types.ts` | Add `showIf?: { name: string; value: unknown }` to `BaseOption` |
| `components/tool-shell/options-panel.tsx` | Skip `OptionRow` when `showIf` condition unmet |
| `lib/converters/pdf-tier3.ts` | Add `expandPage` logic; custom text routing via `headerCustomText`/`footerCustomText` |
| `lib/converters/__tests__/pdf-tier3.test.ts` | Tests for expansion mode and custom text |
| `components/tool-shell/header-footer-preview.tsx` | Expansion layout (bands above/below img); custom text label |
| `content/tools/header-footer.ts` | Add `expandPage`, `headerCustomText`, `footerCustomText`, `'custom'` dropdown choices, FAQ entry |

## Out of Scope

- Per-page expansion amounts
- Asymmetric left/right margin control
- Custom fonts or colours for header/footer text
- Applying `showIf` to option types other than `text` (only needed here for now)

---
title: Compress PDF — Improvements
date: 2026-06-10
status: approved
---

## Overview

Two improvements to the Compress PDF tool:

1. **Aggressive compression mode** — a new "Aggressive" radio choice that rasterizes each PDF page to JPEG via MuPDF and rebuilds a clean PDF. Guarantees size reduction on any PDF at the cost of text selectability.
2. **Limitation copy** — two placements of expectation-setting text so users understand what compresses well before they try.

---

## 1. Aggressive Compression Mode

### Radio option change

The `level` option in `content/tools/compress-pdf.ts` gains a fourth choice and is relabeled:

```ts
{
  type: 'radio',
  name: 'level',
  label: 'Compression level',       // was: 'Quick mode'
  choices: [
    { value: 'low',        label: 'Low (better quality)' },
    { value: 'medium',     label: 'Medium' },
    { value: 'high',       label: 'High (smallest files)' },
    { value: 'aggressive', label: 'Aggressive (convert to images)' },
  ],
  default: 'medium',
  dependsOn: { name: 'targetSizeMode', value: 'false' },
}
```

An inline `hint` is added only for the Aggressive choice. Because the current options schema applies a single `hint` to the whole option, the hint text on the radio option itself should describe the Aggressive choice trade-off — it only reads as relevant when Aggressive is selected. Alternative: render per-choice hints in `OptionsPanel` when Aggressive is the active value.

**Preferred approach:** Add a `conditionalHint` field to the option config (type: `Record<string, string>`) that `OptionsPanel` renders below the radio group only when the matching choice is selected. This keeps the schema clean and the hint contextual.

```ts
conditionalHints: {
  aggressive: 'Pages are converted to images. Text won\'t be selectable. Best for scanned documents.',
}
```

### Compression logic (`lib/converters/pdf.ts`)

Add a new `rasterizePdf` function:

```
async function rasterizePdf(file: File, dpi: number, fileName: string): Promise<File>
```

Steps:
1. Read `file` as `ArrayBuffer`
2. Call `getPageCount(buffer)` (already exists in `mupdf-client.ts`)
3. For each page, call `renderPage(buffer, pageIndex, dpi, 85)` — returns a JPEG `ArrayBuffer`
4. Create a new `PDFDocument` via pdf-lib
5. For each JPEG buffer, embed as image (`doc.embedJpg`) and add a page sized to the image dimensions
6. Save with `useObjectStreams: true`
7. Return as `File`

DPI: **96** — produces readable output at roughly screen resolution, good for email/sharing. Not configurable in v1.

### Integration in `compressPDF`

Add branch in the existing `compressPDF` function:

```ts
if (level === 'aggressive') {
  const file = await rasterizePdf(files[i], 96, files[i].name)
  onProgress?.(i, 100)
  results.push(file)
}
```

Aggressive mode does NOT participate in Target size mode. Target size mode continues to use only the existing six structural/JPEG strategies.

---

## 2. Limitation Copy

### Collapsible disclosure below subtitle (`tool-shell.tsx`)

A new optional `limitationNote` field on `ToolConfig`:

```ts
limitationNote?: {
  summary: string      // shown as the disclosure trigger label
  body: string         // shown when expanded (plain text, no MDX)
}
```

The ToolShell renders this between the subtitle line and the privacy badge, as a `<details>`/`<summary>` element, only when `config.limitationNote` is defined.

For compress-pdf:

```ts
limitationNote: {
  summary: 'What compresses well?',
  body: 'PDFs heavy in metadata, structural overhead, or embedded JPEG images (scanned documents, exported reports) compress most. Text-only PDFs, vector-heavy files, and already-compressed PDFs will shrink little. Use Aggressive mode to guarantee a smaller file — it converts every page to an image.',
}
```

### Per-choice hints in options panel

`OptionsPanel` is updated to render a `conditionalHints` value beneath the radio group whenever the selected choice has a matching hint. Hints for each level:

| Choice | Hint |
|--------|------|
| low | Cleans up internal structure. Text and images untouched. |
| medium | Strips metadata + optimises structure. |
| high | Maximum metadata removal + JPEG re-encoding at 30%. |
| aggressive | Pages are converted to images. Text won't be selectable. Best for scanned documents. |

### FAQ update

The answer to "How much smaller will my PDF get?" is updated:

> Results vary by document. PDFs heavy in structural overhead (many small objects, rich metadata) can shrink 10–30%. PDFs that are mostly scanned images may see little or no reduction because the image data itself is already compressed. For maximum compression of any PDF, use **Aggressive** mode — it converts each page to an image, guaranteeing a smaller file at the cost of text selectability.

---

## Files to change

| File | Change |
|------|--------|
| `content/tools/compress-pdf.ts` | Add fourth radio choice, rename label, add `conditionalHints`, add `limitationNote`, update FAQ answer |
| `lib/converters/pdf.ts` | Add `rasterizePdf` function, add Aggressive branch in `compressPDF` |
| `lib/types.ts` | Add `limitationNote` to `ToolConfig`, add `conditionalHints` to radio option type |
| `components/tool-shell/tool-shell.tsx` | Render `limitationNote` disclosure below subtitle |
| `components/tool-shell/options-panel.tsx` | Render `conditionalHints` below radio group |

---

## Out of scope

- Configurable DPI for Aggressive mode (v1 is fixed at 96 DPI)
- Aggressive mode inside Target size loop
- PNG re-encoding in the existing strategies

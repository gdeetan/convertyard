# Compress PDF Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Aggressive (rasterize) compression mode to Compress PDF and add expectation-setting copy explaining what the tool can and can't compress.

**Architecture:** Five sequential changes — types first, then UI components, then converter logic, then the tool config that wires them all together. Each task is independently committable.

**Tech Stack:** Next.js App Router, TypeScript, pdf-lib (PDF manipulation), MuPDF WASM (page rendering via existing mupdf-client.ts), Tailwind CSS.

---

## File Map

| File | Change |
|------|--------|
| `lib/types.ts` | Add `conditionalHints` to `RadioOption`; add `limitationNote` to `ToolConfig` |
| `components/tool-shell/options-panel.tsx` | Render `conditionalHints` below the active radio choice |
| `components/tool-shell/tool-shell.tsx` | Render `limitationNote` disclosure below subtitle |
| `lib/converters/pdf.ts` | Add `rasterizePdf` function; add Aggressive branch in `compressPDF` |
| `content/tools/compress-pdf.ts` | Rename label, add Aggressive choice + hints, add `limitationNote`, update FAQ |

---

## Task 1: Extend types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add `conditionalHints` to `RadioOption` and `limitationNote` to `ToolConfig`**

Open `lib/types.ts`. Make these two changes:

Change `RadioOption` from:
```ts
export interface RadioOption extends BaseOption {
  type: 'radio'
  choices: Array<{ value: string; label: string }>
  default: string
}
```
To:
```ts
export interface RadioOption extends BaseOption {
  type: 'radio'
  choices: Array<{ value: string; label: string }>
  default: string
  conditionalHints?: Record<string, string>
}
```

Add `limitationNote` to `ToolConfig` after the `options` field:
```ts
options?: ToolOption[]
limitationNote?: {
  summary: string
  body: string
}
warningFn?: (files: File[]) => string | null
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing ones unrelated to these types).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: extend types for conditionalHints and limitationNote"
```

---

## Task 2: Render conditional hints in OptionsPanel

**Files:**
- Modify: `components/tool-shell/options-panel.tsx`

- [ ] **Step 1: Add conditional hint rendering inside the `radio` block**

In `options-panel.tsx`, find the radio block (around line 144). It currently looks like:

```tsx
{opt.type === 'radio' && (
  <fieldset>
    <legend className="sr-only">{opt.label}</legend>
    <div className="flex flex-wrap gap-2">
      {opt.choices.map((c) => (
        ...
      ))}
    </div>
  </fieldset>
)}
```

Replace it with:

```tsx
{opt.type === 'radio' && (
  <>
    <fieldset>
      <legend className="sr-only">{opt.label}</legend>
      <div className="flex flex-wrap gap-2">
        {opt.choices.map((c) => (
          <label
            key={c.value}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5',
              'text-sm transition-colors',
              'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary',
              value === c.value
                ? 'border-primary bg-bg-muted text-primary font-medium'
                : 'border-border text-fg-muted hover:border-border-strong'
            )}
          >
            <input
              type="radio"
              name={`opt-${opt.name}`}
              value={c.value}
              checked={value === c.value}
              onChange={() => onChange(opt.name, c.value)}
              className="sr-only"
            />
            {c.label}
          </label>
        ))}
      </div>
    </fieldset>
    {opt.conditionalHints?.[value as string] && (
      <p className="mt-1.5 text-xs text-fg-subtle">
        {opt.conditionalHints[value as string]}
      </p>
    )}
  </>
)}
```

Note: the `opt` object here has type `ToolOption`. TypeScript will need a type guard to access `conditionalHints`. Either cast inside the block: `(opt as RadioOption).conditionalHints` or narrow the type. The block is already guarded by `opt.type === 'radio'`, so you can safely cast:

```tsx
{(opt as import('@/lib/types').RadioOption).conditionalHints?.[value as string] && (
  <p className="mt-1.5 text-xs text-fg-subtle">
    {(opt as import('@/lib/types').RadioOption).conditionalHints![value as string]}
  </p>
)}
```

`RadioOption` is already imported via `ToolOption` in the file's imports (`import type { ToolOption, ToolOptions, NumberWithChipsOption } from '@/lib/types'`). Add `RadioOption` to that import:

```ts
import type { ToolOption, ToolOptions, NumberWithChipsOption, RadioOption } from '@/lib/types'
```

Then the cast becomes:

```tsx
{(opt as RadioOption).conditionalHints?.[value as string] && (
  <p className="mt-1.5 text-xs text-fg-subtle">
    {(opt as RadioOption).conditionalHints![value as string]}
  </p>
)}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/tool-shell/options-panel.tsx
git commit -m "feat: render conditionalHints below active radio choice"
```

---

## Task 3: Render limitationNote disclosure in ToolShell

**Files:**
- Modify: `components/tool-shell/tool-shell.tsx`

- [ ] **Step 1: Add the disclosure element between subtitle and privacy badge**

In `tool-shell.tsx`, find the header block (around line 209). It currently ends with:

```tsx
<p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
<div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
  <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
  Files never leave your browser. No uploads. No accounts.
</div>
```

Replace with:

```tsx
<p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
{config.limitationNote && (
  <details className="mt-2 group">
    <summary className="cursor-pointer list-none text-sm text-fg-muted hover:text-fg transition-colors select-none inline-flex items-center gap-1">
      <span className="group-open:hidden">▸</span>
      <span className="hidden group-open:inline">▾</span>
      {config.limitationNote.summary}
    </summary>
    <p className="mt-1.5 pl-3 text-sm text-fg-subtle border-l-2 border-border">
      {config.limitationNote.body}
    </p>
  </details>
)}
<div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
  <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
  Files never leave your browser. No uploads. No accounts.
</div>
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/tool-shell/tool-shell.tsx
git commit -m "feat: render limitationNote collapsible disclosure in ToolShell"
```

---

## Task 4: Add rasterizePdf and Aggressive branch in converter

**Files:**
- Modify: `lib/converters/pdf.ts`

- [ ] **Step 1: Add `rasterizePdf` function after the existing helpers (around line 95, before `compressPdfToTargetSize`)**

The function renders every page to JPEG via MuPDF and rebuilds a clean PDF with pdf-lib. `renderPage` clones its input buffer internally before transferring, so the same `buffer` reference is safe to reuse across all pages.

Add this function:

```ts
async function rasterizePdf(file: File, dpi: number, fileName: string): Promise<File> {
  const buffer = await file.arrayBuffer()
  const pageCount = await getPageCount(buffer)
  const doc = await PDFDocument.create()

  for (let p = 0; p < pageCount; p++) {
    const jpegBuffer = await renderPage(buffer, p, dpi, 85)
    const jpegBytes = new Uint8Array(jpegBuffer)
    const image = await doc.embedJpg(jpegBytes)
    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
}
```

`getPageCount` and `renderPage` are already imported at line 2: `import { getPageCount, renderPage } from './mupdf-client'`. No new imports needed.

- [ ] **Step 2: Add Aggressive branch in `compressPDF`**

In `compressPDF` (around line 160), find the `else` branch that handles Quick mode:

```ts
} else {
  onProgress?.(i, 10)
  const level = (options.level as 'low' | 'medium' | 'high') ?? 'medium'
  const buffer = await files[i].arrayBuffer()
  const file = await compressStructural(buffer, level, files[i].name)
  onProgress?.(i, 100)
  results.push(file)
}
```

Replace with:

```ts
} else {
  const level = (options.level as 'low' | 'medium' | 'high' | 'aggressive') ?? 'medium'
  if (level === 'aggressive') {
    onProgress?.(i, 10)
    const file = await rasterizePdf(files[i], 96, files[i].name)
    onProgress?.(i, 100)
    results.push(file)
  } else {
    onProgress?.(i, 10)
    const buffer = await files[i].arrayBuffer()
    const file = await compressStructural(buffer, level, files[i].name)
    onProgress?.(i, 100)
    results.push(file)
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/pdf.ts
git commit -m "feat: add rasterizePdf and Aggressive compression mode"
```

---

## Task 5: Update compress-pdf tool config

**Files:**
- Modify: `content/tools/compress-pdf.ts`

- [ ] **Step 1: Rename radio label, add Aggressive choice, add `conditionalHints`**

Find the `level` radio option. Replace it entirely with:

```ts
{
  type: 'radio',
  name: 'level',
  label: 'Compression level',
  choices: [
    { value: 'low',        label: 'Low (better quality)' },
    { value: 'medium',     label: 'Medium' },
    { value: 'high',       label: 'High (smallest files)' },
    { value: 'aggressive', label: 'Aggressive (convert to images)' },
  ],
  default: 'medium',
  dependsOn: { name: 'targetSizeMode', value: 'false' },
  conditionalHints: {
    low:        'Cleans up internal structure. Text and images untouched.',
    medium:     'Strips metadata + optimises structure.',
    high:       'Maximum metadata removal + JPEG re-encoding at 30%.',
    aggressive: 'Converts every page to an image. Text won\'t be selectable. Best for scanned documents.',
  },
},
```

- [ ] **Step 2: Add `limitationNote` to the config object**

Add this field after `outputExt`:

```ts
limitationNote: {
  summary: 'What compresses well?',
  body: 'PDFs heavy in metadata, structural overhead, or embedded JPEG images — scanned documents, exported reports — shrink the most. Text-only PDFs and vector-heavy files will see little change. Use Aggressive mode to guarantee a smaller file: it converts every page to an image.',
},
```

- [ ] **Step 3: Update the FAQ answer for "How much smaller will my PDF get?"**

Find the FAQ entry with `q: 'How much smaller will my PDF get?'`. Replace the `a` value with:

```ts
a: 'Results vary by document. PDFs heavy in structural overhead (many small objects, rich metadata) can shrink 10–30%. PDFs that are mostly scanned images may see little or no reduction because the image data itself is already compressed. For maximum compression of any PDF, switch to Aggressive mode — it converts each page to an image, guaranteeing a smaller file at the cost of text selectability.',
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add content/tools/compress-pdf.ts
git commit -m "feat: add Aggressive mode, limitation note, and updated FAQ to compress-pdf config"
```

---

## Task 6: Build and deploy

- [ ] **Step 1: Run production build**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm run build 2>&1 | tail -20
```

Expected: build completes with no errors. Static export written to `/out`.

- [ ] **Step 2: Manual smoke test**

Start the dev server:
```bash
npm run dev
```

Open `http://localhost:3000/compress-pdf` and verify:
1. The "What compresses well?" disclosure appears below the subtitle and expands on click.
2. The options panel shows "Compression level" (not "Quick mode").
3. Selecting each radio choice shows the correct hint below the group.
4. Selecting "Aggressive" shows the rasterize warning hint.
5. Drop a PDF, select Aggressive, click Convert — file processes and downloads. It should be smaller than the original and open correctly in a PDF viewer.
6. Target size mode still works (toggle on) — Aggressive choice disappears (dependsOn hides it), quick mode options also hidden, targetKB input shown.

- [ ] **Step 3: Push to deploy**

```bash
git push origin main
```

Cloudflare Pages auto-deploys from `main`. Live in ~1-2 minutes.

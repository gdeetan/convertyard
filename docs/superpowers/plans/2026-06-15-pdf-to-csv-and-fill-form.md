# PDF to CSV + Fill PDF Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two new PDF tools — `pdf-to-csv` (table extraction with page-range selector and preview) and `fill-pdf-form` (AcroForm field UI with flatten option).

**Architecture:** Both tools use custom page.tsx components (not ToolShell) since they require interactive UIs before the conversion step. Converter functions are added to the existing `/lib/converters/pdf.ts`. pdf-to-csv uses mupdf's `extractStructuredText` with Y-position clustering; fill-pdf-form uses pdf-lib's built-in AcroForm API (`getForm()`, `getFields()`).

**Tech Stack:** mupdf-wasm (structured text), pdf-lib (AcroForm), fflate (zip), React, Tailwind, TypeScript

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `/lib/converters/pdf.ts` | Add `pdfToCsv`, `getPdfFormFields`, `fillPdfForm`, new interfaces |
| Create | `/content/tools/pdf-to-csv.ts` | Tool config, FAQ, meta |
| Create | `/content/tools/fill-pdf-form.ts` | Tool config, FAQ, meta |
| Modify | `/content/tool-registry.ts` | Import + register both tools |
| Modify | `/content/tool-catalog.ts` | Add both to PDF category listing |
| Create | `/app/(tools)/pdf-to-csv/page.tsx` | Custom page: dropzone → range → preview → download |
| Create | `/app/(tools)/fill-pdf-form/page.tsx` | Custom page: dropzone → field UI → fill & download |

---

## Task 1: Add `pdfToCsv` converter to `pdf.ts`

**Files:**
- Modify: `/lib/converters/pdf.ts` (append after the `redactPdf` function at line ~720)

- [ ] **Step 1: Add the structured-text helper types and `pageToRows` function**

Append to `/lib/converters/pdf.ts` after the last export:

```typescript
// ── PDF to CSV ────────────────────────────────────────────────────────────────

interface StructuredSpan { text?: string; bbox?: number[] }
interface StructuredLine { spans?: StructuredSpan[] }
interface StructuredBlock { lines?: StructuredLine[] }
interface StructuredPage { blocks?: StructuredBlock[] }

export interface CsvPageResult {
  page: number      // 1-based
  rows: string[][]  // rows[i][j] = cell text
  csv: string       // full CSV string for this page
}

function escapeCsvCell(cell: string): string {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
}

function pageToRows(structuredJson: string): string[][] {
  let pageData: StructuredPage
  try { pageData = JSON.parse(structuredJson) } catch { return [] }

  const spans: Array<{ text: string; x: number; y: number }> = []
  for (const block of pageData.blocks ?? []) {
    for (const line of block.lines ?? []) {
      for (const span of line.spans ?? []) {
        const text = span.text?.trim()
        if (!text || !span.bbox || span.bbox.length < 4) continue
        const [x0, y0, , y1] = span.bbox
        spans.push({ text, x: x0, y: (y0 + y1) / 2 })
      }
    }
  }
  if (spans.length === 0) return []

  const sorted = [...spans].sort((a, b) => a.y - b.y)
  const lineHeightEst = sorted.length > 1
    ? (sorted[sorted.length - 1].y - sorted[0].y) / sorted.length * 2
    : 12
  const tolerance = Math.max(lineHeightEst * 0.8, 4)

  const rowGroups: Array<typeof spans> = []
  let currentRow: typeof spans = []
  let rowY = sorted[0].y

  for (const span of sorted) {
    if (span.y - rowY > tolerance) {
      if (currentRow.length > 0) rowGroups.push(currentRow)
      currentRow = [span]
      rowY = span.y
    } else {
      currentRow.push(span)
      rowY = Math.max(rowY, span.y)
    }
  }
  if (currentRow.length > 0) rowGroups.push(currentRow)

  return rowGroups.map(row => row.sort((a, b) => a.x - b.x).map(s => s.text))
}
```

- [ ] **Step 2: Add `pdfToCsv` function**

Append directly after the code from Step 1:

```typescript
export async function pdfToCsv(
  file: File,
  pageFrom: number,
  pageTo: number,
  onProgress?: (pct: number) => void
): Promise<CsvPageResult[]> {
  const buffer = await file.arrayBuffer()
  const structuredPages = await extractStructuredText(buffer.slice(0))
  const pageCount = structuredPages.length

  const from = Math.max(1, Math.min(pageCount, pageFrom))
  const to = Math.max(from, Math.min(pageCount, pageTo))
  const results: CsvPageResult[] = []

  for (let p = from - 1; p < to; p++) {
    onProgress?.(Math.round(((p - from + 1) / (to - from + 1)) * 100))
    const rows = pageToRows(structuredPages[p])
    const csv = rows.length === 0
      ? `# No extractable text on page ${p + 1}\n`
      : rows.map(row => row.map(escapeCsvCell).join(',')).join('\n')
    results.push({ page: p + 1, rows, csv })
  }

  onProgress?.(100)
  return results
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add lib/converters/pdf.ts
git commit -m "feat: add pdfToCsv converter with Y-clustering row detection"
```

---

## Task 2: Add `getPdfFormFields` + `fillPdfForm` to `pdf.ts`

**Files:**
- Modify: `/lib/converters/pdf.ts`

- [ ] **Step 1: Update pdf-lib import at the top of `pdf.ts`**

Find the existing pdf-lib import (near line 1):
```typescript
import { PDFDocument, PDFRawStream, PDFName, PDFNumber, degrees } from 'pdf-lib'
```

Replace with:
```typescript
import { PDFDocument, PDFRawStream, PDFName, PDFNumber, degrees, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib'
```

- [ ] **Step 2: Add interfaces and `getPdfFormFields`**

Append to `/lib/converters/pdf.ts` after `pdfToCsv`:

```typescript
// ── Fill PDF Forms ────────────────────────────────────────────────────────────

export interface FormField {
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown'
  options?: string[]
  defaultValue?: string | boolean
}

export async function getPdfFormFields(file: File): Promise<FormField[]> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const form = doc.getForm()
  const rawFields = form.getFields()

  const fields: FormField[] = []
  for (const field of rawFields) {
    const name = field.getName()
    if (!name) continue

    if (field instanceof PDFTextField) {
      fields.push({ name, type: 'text', defaultValue: field.getText() ?? '' })
    } else if (field instanceof PDFCheckBox) {
      fields.push({ name, type: 'checkbox', defaultValue: field.isChecked() })
    } else if (field instanceof PDFRadioGroup) {
      const options = field.getOptions()
      fields.push({ name, type: 'radio', options, defaultValue: field.getSelected() ?? '' })
    } else if (field instanceof PDFDropdown) {
      const options = field.getOptions()
      const selected = field.getSelected()
      fields.push({ name, type: 'dropdown', options, defaultValue: selected[0] ?? '' })
    }
    // Unknown field types are silently skipped
  }

  return fields
}
```

- [ ] **Step 3: Add `fillPdfForm`**

Append directly after `getPdfFormFields`:

```typescript
export async function fillPdfForm(
  file: File,
  values: Record<string, string | boolean>,
  flatten: boolean
): Promise<File> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const form = doc.getForm()

  // Build a name→field map to avoid form.getField() throwing on missing names
  const fieldMap = new Map(form.getFields().map(f => [f.getName(), f]))

  for (const [name, value] of Object.entries(values)) {
    const field = fieldMap.get(name)
    if (!field) continue
    try {
      if (field instanceof PDFTextField) {
        field.setText(value as string)
      } else if (field instanceof PDFCheckBox) {
        if (value as boolean) field.check(); else field.uncheck()
      } else if (field instanceof PDFRadioGroup) {
        if (value) field.select(value as string)
      } else if (field instanceof PDFDropdown) {
        if (value) field.select(value as string)
      }
    } catch {
      // Skip fields that fail (e.g., locked or malformed)
    }
  }

  if (flatten) form.flatten()

  const bytes = await doc.save({ useObjectStreams: true })
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}-filled.pdf`, { type: 'application/pdf' })
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/pdf.ts
git commit -m "feat: add getPdfFormFields and fillPdfForm converters using pdf-lib AcroForm API"
```

---

## Task 3: Create `pdf-to-csv` tool config

**Files:**
- Create: `/content/tools/pdf-to-csv.ts`

- [ ] **Step 1: Create the config file**

```typescript
import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'pdf-to-csv',
  title: 'PDF to CSV',
  subtitle: 'Extract tables from any PDF. One CSV per page, in your browser.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.csv',
  convertFn: noop,

  faq: [
    {
      q: 'What gets extracted into the CSV?',
      a: 'We extract the text content from each page and reconstruct rows and columns based on the position of text on the page. This works best on PDFs that were exported from Word, Excel, or a design tool — they have a real text layer with accurate positions. Scanned documents have no text layer and will produce empty CSVs.',
    },
    {
      q: 'Why does my CSV look wrong or jumbled?',
      a: 'PDF was not designed as a table format. Text positions are approximate, especially in PDFs with merged cells, rotated text, or unusual column layouts. If the output looks scrambled, the source PDF likely has a complex layout that does not map cleanly to rows and columns.',
    },
    {
      q: 'Can I extract just specific pages?',
      a: 'Yes. Set the "From page" and "To page" fields before clicking Extract. Only pages in that range will be processed and included in the download.',
    },
    {
      q: 'What is the output format?',
      a: 'You get one CSV file per page. If you extract a single page, you download a .csv file directly. If you extract multiple pages, you get a .zip file containing one .csv per page.',
    },
    {
      q: 'Is my PDF uploaded to your server?',
      a: 'No. Everything runs in your browser using WebAssembly. Your file never leaves your device. The text extraction and CSV generation both happen locally.',
    },
  ],

  relatedTools: ['pdf-to-text', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to CSV Converter — ConvertYard',
    description: 'Extract tables from any PDF as CSV files. One CSV per page, with preview. Free, local, no upload. Works in your browser.',
  },
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add content/tools/pdf-to-csv.ts
git commit -m "feat: add pdf-to-csv tool config and FAQ"
```

---

## Task 4: Create `fill-pdf-form` tool config

**Files:**
- Create: `/content/tools/fill-pdf-form.ts`

- [ ] **Step 1: Create the config file**

```typescript
import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'fill-pdf-form',
  title: 'Fill PDF Form',
  subtitle: 'Fill any PDF form in your browser. Flatten and download.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'What does "flatten" mean?',
      a: 'Flattening burns your answers into the page content and removes the interactive form fields. The result looks identical but the fields can no longer be edited in a PDF reader. This is the right choice for submitting or printing a completed form. If you need the recipient to be able to edit your answers, uncheck the flatten option.',
    },
    {
      q: 'What field types are supported?',
      a: 'Text fields, checkboxes, radio buttons, and dropdown lists. Signature fields are not supported — this tool fills data fields, not cryptographic signatures.',
    },
    {
      q: 'What if my PDF is password-protected?',
      a: 'Password-protected PDFs cannot be filled here. Remove the password first using your PDF reader (File → Properties → Security, or similar), then use this tool.',
    },
    {
      q: 'Is my PDF uploaded to your server?',
      a: 'No. Everything runs in your browser using the pdf-lib library. Your file never leaves your device. The form reading and filling both happen locally.',
    },
    {
      q: 'What is the difference between filling a form and signing a PDF?',
      a: 'Filling adds text to form fields. Signing adds a cryptographic signature that proves the document has not been altered since signing. This tool fills form fields; for legal e-signatures you need a dedicated signing tool.',
    },
  ],

  relatedTools: ['redact-pdf', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Fill PDF Form — ConvertYard',
    description: 'Fill any PDF form in your browser. Supports text fields, checkboxes, dropdowns, radio buttons. Flatten to lock answers. Free, local, no upload.',
  },
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add content/tools/fill-pdf-form.ts
git commit -m "feat: add fill-pdf-form tool config and FAQ"
```

---

## Task 5: Register both tools in registry and catalog

**Files:**
- Modify: `/content/tool-registry.ts`
- Modify: `/content/tool-catalog.ts`

- [ ] **Step 1: Add imports to `tool-registry.ts`**

After the existing `import { config as redactPdf }` line (currently line 27), add:

```typescript
import { config as pdfToCsv } from './tools/pdf-to-csv'
import { config as fillPdfForm } from './tools/fill-pdf-form'
```

- [ ] **Step 2: Add to tools array in `tool-registry.ts`**

After `redactPdf,` in the `tools` array, add:

```typescript
  pdfToCsv,
  fillPdfForm,
```

- [ ] **Step 3: Add to `tool-catalog.ts`**

In `tool-catalog.ts`, find the PDF section. After the `redact-pdf` entry (which you added in the previous session), add nothing — `redact-pdf` was already added. Find the line:

```typescript
  { slug: 'redact-pdf', title: 'Redact PDF', description: 'True redaction — content removed, not hidden.', category: 'pdf', status: 'live', badge: 'Privacy' },
```

Add after it:

```typescript
  { slug: 'pdf-to-csv',    title: 'PDF to CSV',    description: 'Extract tables from any PDF as CSV files.', category: 'pdf', status: 'live' },
  { slug: 'fill-pdf-form', title: 'Fill PDF Form',  description: 'Fill AcroForm fields in your browser, then flatten.', category: 'pdf', status: 'live' },
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add content/tool-registry.ts content/tool-catalog.ts
git commit -m "feat: register pdf-to-csv and fill-pdf-form in tool registry and catalog"
```

---

## Task 6: Build `pdf-to-csv` page

**Files:**
- Create: `/app/(tools)/pdf-to-csv/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
'use client'
import { useState, useCallback, useRef } from 'react'
import { zipSync, strToU8 } from 'fflate'
import { pdfToCsv, type CsvPageResult } from '@/lib/converters/pdf'
import { getPageCount } from '@/lib/converters/mupdf-client'
import { config } from '@/content/tools/pdf-to-csv'

type Phase = 'idle' | 'loading' | 'preview' | 'extracting'

export default function PdfToCsvPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [pageFrom, setPageFrom] = useState(1)
  const [pageTo, setPageTo] = useState(1)
  const [results, setResults] = useState<CsvPageResult[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setPhase('loading')
    setError(null)
    setResults([])
    try {
      const buffer = await f.arrayBuffer()
      const count = await getPageCount(buffer.slice(0))
      setPageCount(count)
      setPageFrom(1)
      setPageTo(count)
      setPhase('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
      setPhase('idle')
    }
  }, [])

  const handleExtract = useCallback(async () => {
    if (!file) return
    setPhase('extracting')
    setError(null)
    try {
      const from = Math.max(1, Math.min(pageCount, pageFrom))
      const to = Math.max(from, Math.min(pageCount, pageTo))
      const csvResults = await pdfToCsv(file, from, to)
      setResults(csvResults)
      setActiveTab(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setPhase('preview')
    }
  }, [file, pageFrom, pageTo, pageCount])

  const handleDownload = useCallback(() => {
    if (!file || results.length === 0) return
    const baseName = file.name.replace(/\.[^.]+$/, '')
    if (results.length === 1) {
      const blob = new Blob([results[0].csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}-page-${results[0].page}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const entries: Record<string, Uint8Array> = {}
      for (const r of results) {
        entries[`${baseName}-page-${r.page}.csv`] = strToU8(r.csv)
      }
      const zipped = zipSync(entries)
      const isFullDoc = pageFrom === 1 && pageTo === pageCount
      const suffix = isFullDoc ? 'all-pages' : `pages-${pageFrom}-${pageTo}`
      const blob = new Blob([zipped], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}-${suffix}.zip`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [file, results, pageFrom, pageTo, pageCount])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf')
    if (f) loadFile(f)
  }, [loadFile])

  const isExtracting = phase === 'extracting'

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">{config.title}</h1>
      <p className="text-gray-500 mb-6">{config.subtitle}</p>

      {/* Drop zone */}
      {(phase === 'idle' || phase === 'loading') && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-400 transition-colors mb-6"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />
          {phase === 'loading'
            ? <p className="text-gray-500">Reading PDF…</p>
            : (
              <>
                <p className="text-lg font-medium mb-1">Drop a PDF here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </>
            )
          }
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Range selector + extract */}
      {(phase === 'preview' || phase === 'extracting') && (
        <>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From page</label>
              <input
                type="number" min={1} max={pageCount} value={pageFrom}
                onChange={(e) => setPageFrom(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                className="w-20 border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To page</label>
              <input
                type="number" min={1} max={pageCount} value={pageTo}
                onChange={(e) => setPageTo(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || pageCount)))}
                className="w-20 border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <span className="text-sm text-gray-400">of {pageCount} page{pageCount !== 1 ? 's' : ''}</span>
            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 text-sm font-medium"
            >
              {isExtracting ? 'Extracting…' : 'Extract'}
            </button>
            <button
              onClick={() => { setPhase('idle'); setFile(null); setResults([]) }}
              className="text-sm text-gray-500 hover:underline"
            >
              Load different file
            </button>
          </div>

          {/* Preview */}
          {results.length > 0 && (
            <>
              {/* Tab strip */}
              <div className="flex gap-1 overflow-x-auto pb-0">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`px-3 py-1.5 text-xs rounded-t-lg border-t border-l border-r whitespace-nowrap transition-colors ${
                      i === activeTab
                        ? 'bg-white border-gray-300 font-medium text-gray-900'
                        : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Page {r.page}
                    {r.rows.length > 0 ? ` · ${r.rows.length} rows` : ' · empty'}
                  </button>
                ))}
              </div>

              {/* Table preview */}
              <div className="border border-gray-300 rounded-b-lg rounded-tr-lg overflow-auto max-h-96 mb-4">
                {results[activeTab]?.rows.length === 0
                  ? (
                    <p className="p-4 text-sm text-gray-400 italic">
                      No extractable text on page {results[activeTab]?.page}. This page may be a scanned image.
                    </p>
                  )
                  : (
                    <table className="text-xs w-full border-collapse">
                      <tbody>
                        {results[activeTab].rows.slice(0, 50).map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-2 py-1 border-r border-b border-gray-100 max-w-xs truncate" title={cell}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {results[activeTab].rows.length > 50 && (
                          <tr>
                            <td colSpan={999} className="px-2 py-2 text-gray-400 italic text-xs">
                              Showing 50 of {results[activeTab].rows.length} rows — full data is in the download.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )
                }
              </div>

              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                {results.length === 1
                  ? `Download page-${results[0].page}.csv`
                  : `Download ${results.length} CSVs as ZIP`
                }
              </button>
            </>
          )}

          {results.length === 0 && !isExtracting && (
            <p className="text-sm text-gray-400">Set your page range and click Extract to preview the data.</p>
          )}
        </>
      )}

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {config.faq?.map((item, i) => (
            <details key={i} className="border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-sm">{item.q}</summary>
              <p className="px-4 pb-4 text-gray-600 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/\(tools\)/pdf-to-csv/page.tsx
git commit -m "feat: add pdf-to-csv page with range selector and row preview"
```

---

## Task 7: Build `fill-pdf-form` page

**Files:**
- Create: `/app/(tools)/fill-pdf-form/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
'use client'
import { useState, useCallback, useRef } from 'react'
import { getPdfFormFields, fillPdfForm, type FormField } from '@/lib/converters/pdf'
import { config } from '@/content/tools/fill-pdf-form'

type Phase = 'idle' | 'loading' | 'filling' | 'done'

export default function FillPdfFormPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [flatten, setFlatten] = useState(true)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setPhase('loading')
    setError(null)
    try {
      const formFields = await getPdfFormFields(f)
      const initialValues: Record<string, string | boolean> = {}
      for (const field of formFields) {
        initialValues[field.name] = field.type === 'checkbox'
          ? (field.defaultValue as boolean) ?? false
          : (field.defaultValue as string) ?? ''
      }
      setFields(formFields)
      setValues(initialValues)
      setPhase('filling')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read form fields')
      setPhase('idle')
    }
  }, [])

  const handleFill = useCallback(async () => {
    if (!file) return
    setSubmitting(true)
    setError(null)
    try {
      const outFile = await fillPdfForm(file, values, flatten)
      setResultUrl(URL.createObjectURL(outFile))
      setResultName(outFile.name)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill form')
    } finally {
      setSubmitting(false)
    }
  }, [file, values, flatten])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf')
    if (f) loadFile(f)
  }, [loadFile])

  const reset = useCallback(() => {
    setPhase('idle')
    setFile(null)
    setFields([])
    setValues({})
    setResultUrl(null)
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">{config.title}</h1>
      <p className="text-gray-500 mb-6">{config.subtitle}</p>

      {/* Drop zone */}
      {(phase === 'idle' || phase === 'loading') && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-400 transition-colors mb-6"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />
          {phase === 'loading'
            ? <p className="text-gray-500">Reading form fields…</p>
            : (
              <>
                <p className="text-lg font-medium mb-1">Drop a PDF form here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </>
            )
          }
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Field form */}
      {phase === 'filling' && (
        <>
          {fields.length === 0 ? (
            <div className="border rounded-xl p-6 mb-6 text-center bg-gray-50">
              <p className="font-medium mb-1">No fillable fields found</p>
              <p className="text-sm text-gray-500">
                This PDF has no AcroForm fields. It may be a flat document or a scanned PDF.
              </p>
            </div>
          ) : (
            <div className="space-y-5 mb-6 max-h-[600px] overflow-y-auto pr-1">
              {fields.map((field) => {
                const label = field.name.length > 60 ? field.name.slice(0, 60) + '…' : field.name
                return (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700" title={field.name}>
                      {label}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={values[field.name] as string ?? ''}
                        onChange={(e) => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    )}
                    {field.type === 'checkbox' && (
                      <input
                        type="checkbox"
                        checked={values[field.name] as boolean ?? false}
                        onChange={(e) => setValues(v => ({ ...v, [field.name]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    )}
                    {field.type === 'radio' && field.options && (
                      <div className="flex flex-wrap gap-4">
                        {field.options.map(opt => (
                          <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={field.name}
                              value={opt}
                              checked={values[field.name] === opt}
                              onChange={() => setValues(v => ({ ...v, [field.name]: opt }))}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {field.type === 'dropdown' && field.options && (
                      <select
                        value={values[field.name] as string ?? ''}
                        onChange={(e) => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Select…</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">Flatten form</span>
              <span className="text-gray-400">(recommended — locks answers, prevents editing)</span>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFill}
                disabled={submitting || fields.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium text-sm"
              >
                {submitting ? 'Filling…' : 'Fill & Download'}
              </button>
              <button onClick={reset} className="text-sm text-gray-500 hover:underline">
                Load different file
              </button>
            </div>
          </div>
        </>
      )}

      {/* Done */}
      {phase === 'done' && resultUrl && (
        <div className="border rounded-xl p-6 mb-6">
          <p className="text-green-700 text-sm mb-4 flex items-center gap-1.5">
            <span>✓</span>
            <span>Form filled successfully</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={resultUrl}
              download={resultName}
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Download {resultName}
            </a>
            <button onClick={reset} className="text-sm text-gray-500 hover:underline self-center">
              Fill another file
            </button>
          </div>
        </div>
      )}

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {config.faq?.map((item, i) => (
            <details key={i} className="border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-sm">{item.q}</summary>
              <p className="px-4 pb-4 text-gray-600 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/\(tools\)/fill-pdf-form/page.tsx
git commit -m "feat: add fill-pdf-form page with AcroForm field UI and flatten toggle"
```

---

## Task 8: Build verification

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` or equivalent — zero errors.

- [ ] **Step 2: Manual test — PDF to CSV**

1. Open `http://localhost:3000/pdf-to-csv` (run `npm run dev` if needed)
2. Drop a PDF that contains a data table (e.g., an Excel export saved as PDF)
3. Verify page count shows correctly, default range is 1 to N
4. Change range to pages 1–2, click Extract
5. Verify preview tabs appear, table rows render correctly
6. Click Download — verify ZIP contains two CSV files with correct data
7. Drop a scanned PDF (image-only) — verify "No extractable text" message on all pages

- [ ] **Step 3: Manual test — Fill PDF Form**

1. Open `http://localhost:3000/fill-pdf-form`
2. Drop a PDF with AcroForm fields (any fillable form — IRS W-9, government form, etc.)
3. Verify all fields render with correct types (text inputs, checkboxes, dropdowns)
4. Fill in values, leave "Flatten form" checked, click Fill & Download
5. Open the downloaded PDF — verify values are present and fields are not editable
6. Repeat with "Flatten form" unchecked — verify fields remain editable in output
7. Drop a flat PDF with no form fields — verify "No fillable fields found" message

- [ ] **Step 4: Verify PDF hub page**

1. Open `http://localhost:3000/pdf`
2. Verify `pdf-to-csv` and `fill-pdf-form` cards appear in the grid

- [ ] **Step 5: Commit final verification note**

```bash
git commit --allow-empty -m "chore: verify pdf-to-csv and fill-pdf-form manual tests pass"
```

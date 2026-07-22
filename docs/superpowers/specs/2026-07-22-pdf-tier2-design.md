# PDF Tier 2 — Format Conversions: Design Spec

## Context

Adding 5 format-conversion PDF tools to ConvertYard. All client-side via pdf-lib + mupdf-wasm + existing browser APIs. One new npm package required (`marked`). All other dependencies already installed.

---

## Tools

### 1. markdown-to-pdf (`/markdown-to-pdf`)

**Input:** `.md` files  
**Output:** `.pdf` per file

**Approach:** Text-searchable PDF rendered with pdf-lib standard fonts.

**Rendering engine (shared with epub-to-pdf):**
- H1 → 24pt Times-Roman-Bold
- H2 → 20pt Times-Roman-Bold  
- H3 → 16pt Times-Roman-Bold
- Body → 12pt Helvetica
- Bold → Helvetica-Bold
- Italic → Helvetica-Oblique
- Inline code → 10pt Courier with light background rectangle
- Code block → 10pt Courier, indented, gray background rectangle
- Bullet list → 10pt Helvetica with "•" prefix, indented 20pt
- Numbered list → 10pt Helvetica with "N." prefix, indented 20pt
- Horizontal rule → thin line across page
- Blockquote → indented 20pt, Helvetica-Oblique

**Parsing:** Add `marked` npm package. Call `marked.lexer(text)` to get token array; walk tokens to generate pdf-lib draw calls.

**Layout:** Top-to-bottom cursor tracking. Auto page break when cursor exceeds page height minus bottom margin. Margins: 60pt all sides.

**Options:**
- `pageSize`: A4 | Letter (default: A4)
- `fontSize`: 8–18pt slider (default: 12 — scales all sizes proportionally)

**Output naming:** `filename.pdf`

---

### 2. csv-to-pdf (`/csv-to-pdf`)

**Input:** `.csv` files  
**Output:** `.pdf` per file

**Approach:** Parse CSV → draw table with pdf-lib grid lines and text.

**CSV parsing:** Manual RFC 4180 parser (no new package). Handles: quoted fields, embedded commas, embedded newlines, CRLF/LF line endings.

**Table rendering:**
- Calculate column widths: max text width per column + 8pt padding each side, capped at `(pageWidth - margins) / colCount`
- Draw horizontal + vertical grid lines with `page.drawLine()`
- Header row (row 0 when toggle on): Helvetica-Bold at `fontSize`
- Body rows: Helvetica at `fontSize`
- Text truncated with `…` if wider than column
- Auto page break: new page continues table (no repeated header in v1)

**Options:**
- `headerRow`: toggle, default true — styles first row as bold header
- `orientation`: Portrait | Landscape (default: Portrait)
- `fontSize`: 6–14pt slider (default: 9)

**Output naming:** `filename.pdf`

---

### 3. heic-to-pdf (`/heic-to-pdf`)

**Input:** `.heic`, `.heif` files  
**Output:** `.pdf` per file or one combined PDF

**Approach:** `heic2any` (already installed, v0.0.4) decodes HEIC → PNG blob → `doc.embedPng()` in pdf-lib → one page per image.

**Pipeline per file:**
1. `heic2any({ blob: file, toType: 'image/png' })` → PNG Blob
2. `doc.embedPng(await blob.arrayBuffer())`
3. `page.drawImage(embedded, { x, y, width, height })` — scaled to fit page with aspect ratio preserved

**Options:**
- `outputMode`: One PDF per image | All images in one PDF (default: one per image)
- `pageSize`: Fit to image | A4 | Letter (default: A4)

**Output naming:** `filename.pdf` (single) or `heic-combined.pdf` (combined)

---

### 4. extract-tables (`/extract-tables`)

**Input:** `.pdf` files  
**Output:** `.zip` per file containing one `.csv` per detected table

**Approach:** Reuse existing `extractStructuredText()` from `mupdf-client.ts` + the table-detection heuristic already implemented in `pdfToCsv` in `pdf.ts`.

**Detection heuristic (already proven in pdfToCsv):**
- Group text spans by Y coordinate (3pt tolerance) → rows
- Within each row, group by X coordinate (10pt tolerance) → columns
- Sort rows by Y, columns by X within each row
- A "table" = a contiguous block of rows where all rows have 2+ columns

**Output per file:** ZIP containing:
- `tablename/page-N-table-M.csv` for each detected table
- If only one table found: `tablename-table.csv` (no subdirectory)

**Options:**
- `pageRange`: text input, default "all" — pages to scan
- `minColumns`: number, default 2 — minimum columns to count as a table

**Output naming:** `filename-tables.zip`

---

### 5. epub-to-pdf (`/epub-to-pdf`)

**Input:** `.epub` files  
**Output:** `.pdf` per file

**Approach:** `fflate.unzipSync()` (already installed) to unzip EPUB → parse OPF manifest → DOMParser to extract chapter text → render with same pdf-lib text engine as markdown-to-pdf.

**EPUB parsing pipeline:**
1. `unzipSync(new Uint8Array(buffer))` → flat file map
2. Read `META-INF/container.xml` → find rootfile path (OPF file)
3. Parse OPF: extract `<spine>` item order → map to `<manifest>` hrefs
4. For each HTML chapter (in spine order):
   - Parse with `new DOMParser().parseFromString(html, 'text/html')`
   - Walk DOM: extract headings (h1–h3), paragraphs, lists, `<pre>` blocks
   - Strip script/style nodes
5. Feed extracted structure to the same rendering engine as markdown-to-pdf

**Limitations (stated in FAQ):**
- Images in EPUB are not rendered (text-only output)
- Complex CSS layouts are ignored
- Custom fonts not embedded (falls back to Helvetica/Times/Courier)

**Options:**
- `pageSize`: A4 | Letter (default: A4)
- `fontSize`: 8–18pt slider (default: 12)

**Output naming:** `filename.pdf`

---

## Shared Text Rendering Engine

Both `markdown-to-pdf` and `epub-to-pdf` use the same rendering function:

```typescript
interface RenderToken {
  type: 'heading' | 'paragraph' | 'code-block' | 'list-item' | 'rule' | 'blockquote' | 'space'
  text: string
  level?: 1 | 2 | 3          // for headings
  ordered?: boolean            // for list-item
  index?: number               // for ordered list-item
  inline?: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }>
}

async function renderTokensToPdf(
  tokens: RenderToken[],
  options: { pageSize: 'A4' | 'Letter'; fontSize: number }
): Promise<Uint8Array>
```

This function lives in `lib/converters/pdf.ts` and is called by both `markdownToPdf` and `epubToPdf` converter functions.

---

## New Package

| Package | Version | Size | Used by |
|---------|---------|------|---------|
| `marked` | ^15.0.0 | ~30KB gzipped | markdown-to-pdf |

No other new packages. All other tools use existing dependencies:
- `heic2any` v0.0.4 — heic-to-pdf
- `fflate` — epub-to-pdf (unzipSync)
- `pdf-lib` v1.17.1 — all tools
- `mupdf` v1.27.0 — extract-tables

---

## Files to Create

| File | Notes |
|------|-------|
| `app/(tools)/markdown-to-pdf/page.tsx` | ToolShell |
| `app/(tools)/csv-to-pdf/page.tsx` | ToolShell |
| `app/(tools)/heic-to-pdf/page.tsx` | ToolShell |
| `app/(tools)/extract-tables/page.tsx` | ToolShell |
| `app/(tools)/epub-to-pdf/page.tsx` | ToolShell |
| `content/tools/markdown-to-pdf.ts` | Config |
| `content/tools/csv-to-pdf.ts` | Config |
| `content/tools/heic-to-pdf.ts` | Config |
| `content/tools/extract-tables.ts` | Config |
| `content/tools/epub-to-pdf.ts` | Config |

## Files to Modify

| File | Change |
|------|--------|
| `lib/converters/pdf.ts` | Add `renderTokensToPdf`, `markdownToPdf`, `csvToPdf`, `heicToPdf`, `extractTables`, `epubToPdf` |
| `content/tool-catalog.ts` | Add 5 new tool entries |
| `package.json` | Add `marked` |

---

## Verification

For each tool after implementation:
1. `npm run build` — no type errors
2. `npm run dev` → open `/[slug]`
3. Drop 1 file → convert → verify output opens correctly
4. markdown-to-pdf: test headings, bold, italic, code blocks, lists
5. csv-to-pdf: test multi-column CSV, CSV with quoted commas, large CSV (100+ rows)
6. heic-to-pdf: test single HEIC, batch HEICs, combined mode
7. extract-tables: test a PDF with a known table (e.g., a bank statement); text-only PDF → expect "no tables found" message
8. epub-to-pdf: test a real .epub file (Project Gutenberg); verify chapters in correct order

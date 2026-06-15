# Design: PDF to CSV + Fill PDF Forms

Date: 2026-06-15
Tools: `pdf-to-csv`, `fill-pdf-form`
Stack: mupdf-wasm (structured text extraction), pdf-lib (AcroForm), no new deps

---

## Context

Two tools in the PDF cluster (Prompt 21). Both are medium complexity with no new dependencies.

- `pdf-to-csv`: ~6K monthly searches, "severely underserved" per cluster brief. Data analysts manually re-key tables daily.
- `fill-pdf-form`: ~15K monthly searches. Primary use case: fill a form once, flatten, send or print.

---

## PDF to CSV

### Converter

**File:** `/lib/converters/pdf.ts` — add `pdfToCsv`

```typescript
pdfToCsv(
  files: File[],
  opts: { pageFrom: number; pageTo: number },
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]>
```

Per page in range:
1. `extractStructuredText(buffer)` → parse JSON blocks → lines → spans
2. Sort lines by Y, sort spans within each line by X → rows × columns
3. CSV-escape each cell (`"` → `""`), wrap in quotes if cell contains comma/newline
4. Join cells with `,`, rows with `\n`
5. If page yields no spans → emit single-row CSV with comment: `# No extractable text on page N`

Output per file:
- Single page in range → `report-page-3.csv` (plain File, no zip)
- Multiple pages → `report-pages-3-7.zip` (fflate, one CSV per page)
- Full doc (default range) → `report-all-pages.zip`

Naming: strip extension from input filename, append `-page-N.csv` or `-pages-N-M.zip`.

**Table detection algorithm:**
Primary: use mupdf's block → line → span hierarchy directly (each `line` = one CSV row, spans sorted by X = columns).
Fallback: if a page's structured text has spans but no line grouping, cluster spans by Y-position (tolerance: 0.8× median line height) before sorting by X.

### UI

**File:** `/app/(tools)/pdf-to-csv/page.tsx` — custom page (not ToolShell)

Phase state machine: `idle → loading → preview → done`

**idle:** Dropzone (drag-and-drop + click to browse), accepts `.pdf`.

**loading:** Extract structured text from all pages via `extractStructuredText`. Show spinner with page count progress.

**preview:**
- Page range inputs: `From [1] To [N]` (default: 1 to total page count)
- "Extract" button triggers CSV generation for selected range
- Preview panel: tab strip per page in range
  - Tab header: "Page N · X cols · Y rows"
  - Table preview: first 50 rows rendered as `<table>` with `overflow-y: auto`
  - Empty page: grey placeholder "No extractable text on this page"
- "Download" button: triggers ZIP/CSV download

**done:** Download link + "Extract another file" reset.

**Edge cases:**
- Scanned PDF (no text layer) → all pages show "No extractable text" — add note: "This PDF appears to be scanned. Use a PDF OCR tool first."
- Page range where `from > to` → clamp silently to valid range
- Very wide tables (>20 cols) → horizontal scroll on preview table

### Config

**File:** `/content/tools/pdf-to-csv.ts`

```typescript
{
  slug: 'pdf-to-csv',
  title: 'PDF to CSV',
  subtitle: 'Extract tables from any PDF. One CSV per page, in your browser.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.csv',
  convertFn: noop,  // logic lives in page.tsx
  options: [
    { type: 'number', name: 'pageFrom', label: 'From page', min: 1, default: 1 },
    { type: 'number', name: 'pageTo',   label: 'To page',   min: 1, default: 9999 },
  ],
  faq: [/* 5 entries — see below */],
  relatedTools: ['pdf-to-text', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  meta: {
    title: 'PDF to CSV Converter — ConvertYard',
    description: 'Extract tables from any PDF as CSV files. One CSV per page. Free, local, no upload. Works in your browser.',
  },
}
```

**FAQ (5 entries):**
1. What gets extracted? — Text content arranged in rows/columns. Works best on PDFs with a real text layer (exported from Word, Excel, etc.), not scanned images.
2. Why does my CSV look wrong? — Scanned or image-only PDFs have no text layer. PDFs with unusual layouts (merged cells, diagonal text) may not reconstruct cleanly.
3. Can I extract just specific pages? — Yes. Set the "From page" and "To page" fields before clicking Extract.
4. What's the output format? — One CSV file per page, delivered as a ZIP if multiple pages are selected.
5. Is my PDF uploaded? — No. Everything runs in your browser using WebAssembly. Your file never leaves your device.

### SEO

- Target keyword: "pdf to csv"
- Secondary: "extract table from pdf", "pdf table to excel", "pdf to csv converter free"
- URL: `/pdf-to-csv`

---

## Fill PDF Forms

### Converter

**File:** `/lib/converters/pdf.ts` — add `fillPdfForm` and `getPdfFormFields`

```typescript
interface FormFieldValue {
  name: string
  value: string | boolean  // string for text/dropdown/radio, boolean for checkbox
}

interface FormField {
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown'
  options?: string[]   // for dropdown and radio
  defaultValue?: string | boolean
}

getPdfFormFields(file: File): Promise<FormField[]>

fillPdfForm(file: File, values: FormFieldValue[], flatten: boolean): Promise<File>
```

**`getPdfFormFields`:**
1. `PDFDocument.load(buffer)` → `doc.getForm().getFields()`
2. For each field: detect type via `instanceof PDFTextField / PDFCheckBox / PDFRadioGroup / PDFDropdown`
3. Return typed `FormField[]`, skipping fields with no name

**`fillPdfForm`:**
1. `PDFDocument.load(buffer)` → `doc.getForm()`
2. For each `FormFieldValue`:
   - `PDFTextField` → `field.setText(value as string)`
   - `PDFCheckBox` → `(value as boolean) ? field.check() : field.uncheck()`
   - `PDFRadioGroup` → `field.select(value as string)`
   - `PDFDropdown` → `field.select(value as string)`
3. If `flatten`: `form.flatten()`
4. `doc.save()` → return `new File([bytes], `${baseName}-filled.pdf`, { type: 'application/pdf' })`

### UI

**File:** `/app/(tools)/fill-pdf-form/page.tsx` — custom page (not ToolShell)

Phase state machine: `idle → loading → filling → done`

**idle:** Dropzone, accepts `.pdf`.

**loading:** `getPdfFormFields(file)` — reads AcroForm fields client-side. Shows "Reading form fields…"

**filling:**
- Field list rendered top-to-bottom in document order
- Per field type:
  - `text` → `<input type="text" placeholder={field.name}>`
  - `checkbox` → `<input type="checkbox">` with label
  - `radio` → `<fieldset>` with one `<input type="radio">` per option
  - `dropdown` → `<select>` with `<option>` per `field.options`
- "Flatten form" toggle, default ON, hint: "Recommended — prevents recipients from editing your answers"
- "Fill & Download" button → calls `fillPdfForm`, triggers download

**Edge cases:**
- No fields detected → "This PDF has no fillable form fields." with note suggesting redact-pdf or pdf-to-text
- Encrypted PDF → show error: "This PDF is password-protected and cannot be filled here."
- Field with very long name → truncate label at 60 chars, show full name as `title` attribute
- >50 fields → render with `max-h-[600px] overflow-y-auto` scroll container

**done:** Download link + "Fill another file" reset.

### Config

**File:** `/content/tools/fill-pdf-form.ts`

```typescript
{
  slug: 'fill-pdf-form',
  title: 'Fill PDF Form',
  subtitle: 'Fill any PDF form in your browser. Flatten and download.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,
  faq: [/* 5 entries — see below */],
  relatedTools: ['redact-pdf', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  meta: {
    title: 'Fill PDF Form — ConvertYard',
    description: 'Fill any PDF form in your browser. Supports text fields, checkboxes, dropdowns. Flatten to lock answers. Free, local, no upload.',
  },
}
```

**FAQ (5 entries):**
1. What does "flatten" mean? — Flattening burns your answers into the page content and removes the interactive form fields. The result looks identical but cannot be edited in a PDF reader. Recommended for sending or printing.
2. What field types are supported? — Text fields, checkboxes, radio buttons, and dropdown lists. Signature fields are not supported.
3. What if my PDF is password-protected? — Password-protected PDFs cannot be filled here. Remove the password first using your PDF reader, then use this tool.
4. Is my PDF uploaded to your server? — No. Everything runs in your browser using WebAssembly and the pdf-lib library. Your file never leaves your device.
5. What's the difference between filling a form and signing a PDF? — Filling adds text to form fields. Signing adds a cryptographic signature that proves the document hasn't been altered. This tool fills; for signing you need a dedicated e-signature tool.

### SEO

- Target keyword: "fill pdf form"
- Secondary: "fill pdf form free", "fill pdf form online", "flatten pdf form"
- URL: `/fill-pdf-form`

---

## Shared Implementation Steps

1. Add `pdfToCsv` + `getPdfFormFields` + `fillPdfForm` to `/lib/converters/pdf.ts`
2. Create `/content/tools/pdf-to-csv.ts`
3. Create `/content/tools/fill-pdf-form.ts`
4. Create `/app/(tools)/pdf-to-csv/page.tsx`
5. Create `/app/(tools)/fill-pdf-form/page.tsx`
6. Register both in `/content/tool-registry.ts`
7. Add both to `/content/tool-catalog.ts` (pdf category, status: live)

## Verification Checklist

- [ ] Drop a PDF with a data table → preview shows correct rows/columns
- [ ] Set page range 2–4 on a 10-page PDF → only pages 2, 3, 4 in ZIP
- [ ] Scanned PDF → "No extractable text" message on all pages
- [ ] Drop a PDF form → all text/checkbox/dropdown fields render
- [ ] Fill fields + flatten → output PDF has locked answers, text not selectable as form fields
- [ ] Fill fields without flatten → output PDF still editable in reader
- [ ] PDF with no form fields → "no fillable fields" message shown
- [ ] `npm run build` → zero TypeScript errors

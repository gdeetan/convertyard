import { pdfToExcel } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-excel',
  title: 'PDF to Excel Converter',
  subtitle: 'Extract tables and data from PDFs into Excel. Browser-only.',
  bestFor: 'Best for pulling editable data from bank statements, invoices, or financial reports.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.xlsx',
  convertFn: pdfToExcel,
  enablePresets: true,
  limitationNote: {
    summary: 'Works best on text-based PDFs with clear table structure',
    body: 'Extracts text with positional data and groups into rows/columns. Works well on clean tabular PDFs (bank statements, reports, invoices). Scanned PDFs are processed with Tesseract OCR automatically — table extraction from scans is best-effort and accuracy depends on scan quality.',
  },
  options: [
    {
      type: 'toggle',
      name: 'combineSheets',
      label: 'Combine all pages into one sheet',
      hint: 'When off, each page becomes its own worksheet. When on, all pages are stacked in one sheet.',
      default: false,
    },
    {
      type: 'dropdown',
      name: 'ocrLanguage',
      label: 'Document language (scanned PDFs)',
      hint: 'Used only when OCR is needed for scanned PDFs. Choose the primary language in the document.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'hin', label: 'Hindi' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'ara', label: 'Arabic' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
      ],
      default: 'eng',
    },
  ],
  faq: [
    {
      q: 'Are my PDFs uploaded to your servers during extraction?',
      a: 'Never. All extraction runs in your browser using WebAssembly. Your PDFs never leave your device.',
    },
    {
      q: 'When does PDF to Excel work well?',
      a: 'It works best on PDFs where text is clearly arranged in rows and columns — bank statements, financial reports, invoices, data exports. The tool uses text-position heuristics to detect column boundaries.',
    },
    {
      q: 'When does the table extraction produce bad results?',
      a: 'PDFs with merged cells, rotated headers, footnotes embedded mid-table, or very narrow column gaps often produce misaligned rows. The output is usable as a starting point but may need cleanup. Complex layouts are an inherent limitation of extracting from PDF.',
    },
    {
      q: 'How are scanned PDFs handled?',
      a: 'Scanned PDFs have no text layer, so OCR runs automatically using Tesseract. Select the correct language for best accuracy. Table extraction from OCR output is best-effort — accuracy depends on scan quality and table complexity.',
    },
    {
      q: 'How are multi-page PDFs handled?',
      a: 'By default, each page becomes its own worksheet. Toggle "Combine all pages" to stack all pages into a single worksheet. Use combine mode when your table spans multiple pages.',
    },
  ],
  relatedTools: ['pdf-to-csv', 'excel-to-pdf', 'pdf-to-text', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'PDF to Excel Converter — ConvertYard',
    description: 'Extract tables from PDFs into Excel spreadsheets. Auto-detects rows and columns. Browser-only — files never uploaded. Batch convert up to 1,000 PDFs.',
  },
}

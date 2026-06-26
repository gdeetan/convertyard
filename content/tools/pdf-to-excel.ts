import { pdfToExcel } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-excel',
  title: 'PDF to Excel Converter',
  subtitle: 'Extract tables and data from PDFs into Excel. Browser-only.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.xlsx',
  convertFn: pdfToExcel,
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
      q: 'When does PDF to Excel work well?',
      a: 'It works best on PDFs where text is clearly arranged in rows and columns — bank statements, financial reports, data tables, invoices.',
    },
    {
      q: 'When does it not work well?',
      a: "Scanned PDFs (photos of documents), PDFs with merged cells, or complex multi-column layouts may produce imperfect results. For scanned PDFs, OCR runs automatically — select the correct language in options for non-English documents.",
    },
    {
      q: 'How are multi-page PDFs handled?',
      a: "By default, each page becomes its own worksheet. Toggle 'Combine all pages' to stack all pages into a single worksheet.",
    },
    {
      q: 'What format is the output?',
      a: 'Standard .xlsx (Excel 2007+). Open in Microsoft Excel, Google Sheets, LibreOffice Calc, or Numbers.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'Never. All extraction runs in your browser using WebAssembly. Your PDFs never leave your device.',
    },
  ],
  relatedTools: ['pdf-to-csv', 'excel-to-pdf', 'pdf-to-text', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'PDF to Excel Converter — ConvertYard',
    description: 'Extract tables from PDFs into Excel spreadsheets. Auto-detects rows and columns. Browser-only — files never uploaded. Batch convert up to 1,000 PDFs.',
  },
}

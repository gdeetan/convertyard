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
    body: 'Extracts text with positional data and groups into rows/columns. Works well on clean tabular PDFs (bank statements, reports, invoices). Does not work on scanned PDFs — images of pages return no data.',
  },
  options: [
    {
      type: 'toggle',
      name: 'combineSheets',
      label: 'Combine all pages into one sheet',
      hint: 'When off, each page becomes its own worksheet. When on, all pages are stacked in one sheet.',
      default: false,
    },
  ],
  faq: [
    {
      q: 'When does PDF to Excel work well?',
      a: 'It works best on PDFs where text is clearly arranged in rows and columns — bank statements, financial reports, data tables, invoices.',
    },
    {
      q: 'When does it not work well?',
      a: "Scanned PDFs (photos of documents), PDFs with merged cells, or complex multi-column layouts. For scanned PDFs, run them through the PDF to Text tool first.",
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

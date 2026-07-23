import { extractTables } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'extract-tables',
  title: 'Extract Tables from PDF',
  subtitle: 'Local-first PDF table extraction. Built for batches.',
  bestFor: 'Best for pulling tables out of bank statements, reports, and data PDFs into spreadsheet-ready CSV files.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.zip',
  convertFn: extractTables,
  options: [
    {
      type: 'number',
      name: 'minColumns',
      label: 'Minimum columns',
      hint: 'Rows with fewer columns than this are not counted as part of a table.',
      min: 1,
      max: 10,
      step: 1,
      default: 2,
    },
  ],
  faq: [
    {
      q: 'Are my PDFs uploaded to a server?',
      a: 'Never. All extraction runs in your browser via WebAssembly. Your files never leave your device.',
    },
    {
      q: 'What kinds of PDFs work best?',
      a: 'PDFs with real text — exported reports, bank statements, invoices. Scanned documents (image-based PDFs) contain no extractable text, so table detection will find nothing. Use the OCR PDF tool first if your PDF is scanned.',
    },
    {
      q: 'How does the tool detect tables?',
      a: 'It groups text spans by their Y position to identify rows, then groups by X position to identify columns. Contiguous blocks of rows with two or more columns are treated as tables.',
    },
    {
      q: 'What does the output ZIP contain?',
      a: 'One CSV file per detected table. If multiple tables are found, they are named page-N-table-M.csv. If only one table is found, it is saved as filename-table.csv.',
    },
    {
      q: 'Can I scan specific pages only?',
      a: 'Use the page range field to target specific pages, e.g. "1-5" or "1,3,7". Leave it empty to scan all pages.',
    },
  ],
  relatedTools: ['pdf-to-csv', 'pdf-to-excel', 'compress-pdf', 'pdf-to-text'],
  relatedArticles: [],
  meta: {
    title: 'Extract Tables from PDF — ConvertYard',
    description: 'Extract tables from PDF files as CSV. Batch process up to 1000 PDFs in your browser — no uploads, no account, entirely local.',
  },
}

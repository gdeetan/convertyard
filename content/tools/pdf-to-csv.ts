import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'pdf-to-csv',
  title: 'PDF to CSV',
  subtitle: 'Extract tables from any PDF. One CSV per page, in your browser.',
  bestFor: 'Best for pulling tabular data out of bank statements, reports, or invoices for analysis.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.csv',
  convertFn: noop,

  faq: [
    {
      q: 'Is my PDF uploaded to your server during extraction?',
      a: 'No. Everything runs in your browser using WebAssembly. Your file never leaves your device — text extraction and CSV generation both happen locally.',
    },
    {
      q: 'What gets extracted into the CSV?',
      a: 'Text content from each page is reconstructed into rows and columns based on text positions. This works best on PDFs exported from Word, Excel, or a design tool — they have an accurate text layer. Scanned documents have no text layer and produce empty CSVs.',
    },
    {
      q: 'Why does my CSV look jumbled or have columns in the wrong order?',
      a: 'PDF was not designed as a table format. Text positions are approximate, especially in documents with merged cells, rotated text, or columns that are close together. If the output is scrambled, the PDF layout does not map cleanly to rows and columns — try PDF to Excel instead, which uses a heuristic table-detection layer.',
    },
    {
      q: 'What is the difference between PDF to CSV and PDF to Excel?',
      a: 'PDF to CSV gives you plain comma-separated text — one file per page, no formatting. PDF to Excel attempts to group data into worksheets and preserves some structure. Use CSV when you are piping data into a script or spreadsheet app that prefers raw data; use Excel when you want something you can open and review immediately.',
    },
    {
      q: 'Can I extract just specific pages?',
      a: 'Yes. Set the "From page" and "To page" fields before clicking Extract. Only pages in that range are processed. A single-page extract downloads as a .csv file; multi-page extracts download as a .zip containing one .csv per page.',
    },
  ],

  relatedTools: ['pdf-to-text', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to CSV Converter — ConvertYard',
    description: 'Extract tables from any PDF as CSV files. One CSV per page, with preview. Free, local, no upload. Works in your browser.',
  },
}

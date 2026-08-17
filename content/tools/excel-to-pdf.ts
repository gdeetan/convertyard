import { excelToPdf } from '@/lib/converters/office'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'excel-to-pdf',
  title: 'Excel to PDF Converter',
  subtitle: 'Convert spreadsheets to PDF with multi-sheet support. Browser-only.',
  bestFor: 'Best for sharing spreadsheet data when recipients should not edit the numbers.',
  category: 'pdf',
  accepts: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
  acceptsExt: ['.xlsx', '.xls', '.xlsm', '.csv'],
  outputExt: '.pdf',
  convertFn: excelToPdf,
  enablePresets: true,
  options: [
    {
      type: 'radio',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'letter', label: 'US Letter' },
        { value: 'a4', label: 'A4' },
        { value: 'legal', label: 'Legal' },
      ],
      default: 'letter',
    },
    {
      type: 'radio',
      name: 'orientation',
      label: 'Orientation',
      choices: [
        { value: 'landscape', label: 'Landscape' },
        { value: 'portrait', label: 'Portrait' },
      ],
      default: 'landscape',
    },
  ],
  faq: [
    {
      q: 'Does converting my spreadsheet upload it to your servers?',
      a: 'No. The conversion runs entirely in your browser using WebAssembly. Your spreadsheet never leaves your device.',
    },
    {
      q: 'What gets preserved in the PDF?',
      a: 'Cell values, basic text formatting (bold headers), and grid borders. Each worksheet becomes its own page in the PDF.',
    },
    {
      q: 'What is not preserved?',
      a: 'Charts, graphs, conditional formatting, and formula text. Formulas are converted to their evaluated values — only the result appears, not the formula.',
    },
    {
      q: 'What if my sheet is very wide and columns are getting cut off?',
      a: 'Switch to Landscape orientation and use Legal page size. Columns that still exceed the page width are truncated — this is a limitation of browser-based layout; for wide sheets, splitting the data across multiple sheets before converting usually gives a cleaner result.',
    },
    {
      q: 'Can I convert a CSV file?',
      a: 'Yes. CSV files are treated as a single-sheet spreadsheet and rendered as a plain table. There is no formatting in CSV so the output is plain grid with no bold or borders.',
    },
    {
      q: 'Why is my multi-sheet workbook only showing one page per sheet?',
      a: 'Each worksheet maps to one PDF page. If a sheet has many rows, they are scaled to fit one page. This keeps the page count predictable but small text may be hard to read. Consider splitting large sheets before converting.',
    },
  ],
  relatedTools: ['pdf-to-excel', 'word-to-pdf', 'pdf-to-csv', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Excel to PDF Converter — ConvertYard',
    description: 'Convert Excel spreadsheets to PDF in your browser. Multi-sheet workbooks, fit-to-page. Batch up to 1,000 files. Nothing is uploaded — the file stays local.',
  },
}

import { excelToPdf } from '@/lib/converters/office'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'excel-to-pdf',
  title: 'Excel to PDF Converter',
  subtitle: 'Convert spreadsheets to PDF with multi-sheet support. Browser-only.',
  category: 'pdf',
  accepts: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
  acceptsExt: ['.xlsx', '.xls', '.xlsm', '.csv'],
  outputExt: '.pdf',
  convertFn: excelToPdf,
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
      q: 'What gets preserved when converting Excel to PDF?',
      a: 'Cell values, basic text formatting (bold headers), and grid borders. Each worksheet becomes its own page in the PDF.',
    },
    {
      q: 'What is not preserved?',
      a: 'Charts, graphs, conditional formatting, and formula text. Formulas are converted to their evaluated values.',
    },
    {
      q: 'How are multiple sheets handled?',
      a: 'Each worksheet becomes one page in the PDF, in order. Empty sheets are skipped.',
    },
    {
      q: 'Can I convert CSV files?',
      a: 'Yes. CSV files are treated as a single-sheet spreadsheet and displayed as a table.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'Never. All processing happens in your browser. Your spreadsheets never leave your device.',
    },
    {
      q: 'What if my sheet is very wide?',
      a: 'Use Landscape orientation and Letter or Legal page size. Columns that exceed the page width are truncated in browser-based conversion.',
    },
  ],
  relatedTools: ['pdf-to-excel', 'word-to-pdf', 'pdf-to-csv', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Excel to PDF Converter — ConvertYard',
    description: 'Convert Excel spreadsheets to PDF in your browser. Multi-sheet support. Batch convert up to 1,000 files. No upload required.',
  },
}

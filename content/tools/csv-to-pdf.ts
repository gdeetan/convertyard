import { csvToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'csv-to-pdf',
  title: 'CSV to PDF Converter',
  subtitle: 'Local-first CSV to table PDF. Built for batches.',
  bestFor: 'Best for sharing spreadsheet data as a printable table without requiring Excel or Google Sheets.',
  category: 'pdf',
  accepts: ['text/csv', 'text/plain'],
  acceptsExt: ['.csv'],
  outputExt: '.pdf',
  convertFn: csvToPdf,
  enablePresets: true,
  options: [
    {
      type: 'toggle',
      name: 'headerRow',
      label: 'First row is header',
      hint: 'Styles the first row in bold with a gray background.',
      default: true,
    },
    {
      type: 'dropdown',
      name: 'orientation',
      label: 'Orientation',
      choices: [
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
      default: 'portrait',
    },
    {
      type: 'slider',
      name: 'fontSize',
      label: 'Font size (pt)',
      min: 6,
      max: 14,
      step: 1,
      default: 9,
    },
  ],
  faq: [
    {
      q: 'Are my CSV files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser. Your data never leaves your device.',
    },
    {
      q: 'Does it handle CSVs with commas inside fields?',
      a: 'Yes. The parser follows RFC 4180 — quoted fields with embedded commas, newlines, and escaped quotes are all handled correctly.',
    },
    {
      q: 'What happens if a cell is too wide for the column?',
      a: 'Text is truncated with an ellipsis (…) to fit within the column. Use Landscape orientation or a smaller font size to fit more columns.',
    },
    {
      q: 'Can I convert multiple CSVs at once?',
      a: 'Yes. Drop multiple .csv files — each gets its own PDF.',
    },
    {
      q: 'What page size does the output use?',
      a: 'A4. Toggle Landscape orientation in the options to rotate to 297 × 210mm for wide tables.',
    },
  ],
  relatedTools: ['markdown-to-pdf', 'pdf-to-csv', 'compress-pdf', 'pdf-to-excel'],
  relatedArticles: [],
  meta: {
    title: 'CSV to PDF Converter — ConvertYard',
    description:
      'Convert CSV files to PDF tables in your browser. Batch convert 1000 files at once — no uploads, no account, entirely local.',
  },
}

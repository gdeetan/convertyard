import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ConversionResult, ToolConfig, ToolOptions } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-to-excel',
  title: 'Image to Excel Converter',
  subtitle: 'Drop a table screenshot. Get a clean .xlsx file.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.xlsx',
  convertFn: (files: File[], opts: ToolOptions, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'excel' }, onProgress),

  limitationNote: {
    summary: 'OCR-based — spot-check column alignment on dense tables',
    body: 'The converter detects column boundaries from the image and OCRs each cell individually. Results are most accurate on screenshots with consistent spacing. Always verify numbers match the source before using in calculations.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'jpn', label: 'Japanese' },
      ],
      default: 'eng',
    },
  ],

  faq: [
    {
      q: 'How does this work?',
      a: 'The tool detects column and row boundaries from the image pixels, then OCRs each cell individually. The result is written to a .xlsx file with the same layout as the original table.',
    },
    {
      q: 'What types of tables work best?',
      a: 'Screenshots of spreadsheets, web tables, and reports with consistent column spacing. Both bordered tables (visible grid lines) and borderless tables are supported.',
    },
    {
      q: 'Can I open the output directly in Excel or Google Sheets?',
      a: 'Yes. The output is a standard .xlsx file — open it directly in Excel, Google Sheets, or LibreOffice Calc.',
    },
    {
      q: 'Should I verify the spreadsheet before using it in calculations?',
      a: 'Yes — especially for numbers. Scan a few rows to confirm column alignment and spot-check totals against the source image before building formulas.',
    },
    {
      q: 'Does it work on invoice or receipt images?',
      a: 'For receipts where you need vendor, date, and total extracted into specific fields, use the Receipt to Text tool instead.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. All processing runs entirely in your browser. Your images never leave your device.',
    },
  ],

  relatedTools: ['receipt-to-text', 'jpg-to-text', 'ocr-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Image to Excel Converter — ConvertYard',
    description: 'Convert table screenshots to Excel. Drop an image, get a .xlsx file with the same layout. No uploads, no account — runs in your browser.',
  },
}

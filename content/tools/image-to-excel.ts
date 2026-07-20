import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ConversionResult, ToolConfig, ToolOptions } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-to-excel',
  title: 'Image to Excel Converter',
  subtitle: 'Drop a table screenshot. Get a clean .xlsx file.',
  bestFor: 'Best for copying tables from screenshots, reports, or web pages into an editable spreadsheet.',
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
      q: 'Are my images uploaded anywhere to extract the table?',
      a: 'No. All processing runs entirely in your browser. Your images never leave your device.',
    },
    {
      q: 'What types of tables give the best results?',
      a: 'Tables with clearly visible grid lines, consistent column spacing, and high-contrast text on a white background. Borderless tables are supported but cell boundaries are harder to detect. Merged cells and multi-row headers often get split or misaligned.',
    },
    {
      q: 'Why are some cells in the wrong column or row?',
      a: 'The converter detects column boundaries from pixel spacing. Tables without borders or with inconsistent column widths can confuse the boundary detection. Try cropping tightly to the table area — removing surrounding whitespace or UI chrome helps.',
    },
    {
      q: 'Should I verify the numbers before using them in calculations?',
      a: 'Yes. OCR can misread digits — 0 and 8, 1 and 7, 5 and 6 are common confusion pairs. Spot-check a few totals against the source image before building formulas.',
    },
    {
      q: 'Does this work on receipt or invoice images?',
      a: 'For receipts where you need vendor, date, and total in named fields, the Receipt to Text tool is a better fit. For invoices that are structured as tables, try this tool and verify the output.',
    },
  ],

  relatedTools: ['receipt-to-text', 'jpg-to-text', 'ocr-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Image to Excel Converter — ConvertYard',
    description: 'Convert table screenshots to Excel. Drop an image, get a .xlsx file with the same layout. No uploads, no account — runs in your browser.',
  },
}

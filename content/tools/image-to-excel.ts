import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-to-excel',
  title: 'Image to Excel Converter',
  subtitle: 'Extract tables from images into .xlsx spreadsheets. No retyping.',
  category: 'images',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.xlsx',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'excel' }, onProgress),

  limitationNote: {
    summary: 'Works best on clearly structured tables',
    body: 'Bordered tables and borderless tables with consistent column spacing extract well. Merged cells and complex nested tables may not preserve their structure.',
  },

  options: [
    {
      type: 'radio',
      name: 'recognitionEngine',
      label: 'Recognition engine',
      choices: [
        { value: 'standard', label: 'Standard — all languages, no download' },
        { value: 'ai-enhanced', label: 'AI-Enhanced — English only, ~262MB (may be cached)' },
      ],
      default: 'standard',
      conditionalHints: {
        standard: 'Tesseract OCR with image preprocessing. Works with all languages. Best for clean, printed text.',
        'ai-enhanced': 'Florence-2 + TrOCR: processes the full page at once without line segmentation, then falls back to TrOCR for lines Florence-2 misses. Downloads ~262MB on first use — shared with the Image Description tool so may already be cached. English only.',
      },
    },
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Choose the language of text in the table. Standard engine only — AI-Enhanced uses English.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
      ],
      default: 'eng',
    },
  ],

  faq: [
    {
      q: 'What types of tables does it handle best?',
      a: 'Bordered tables with visible grid lines extract most accurately. Borderless tables with consistent column spacing also work well. Complex nested tables or tables with merged cells may need manual cleanup.',
    },
    {
      q: 'Can I open the output directly in Excel or Google Sheets?',
      a: 'Yes. The output is a standard .xlsx file — open it directly in Excel, Google Sheets, or LibreOffice Calc.',
    },
    {
      q: 'Does it work on invoice images?',
      a: 'Yes — invoices with line-item tables extract cleanly. Use the Receipt to Text tool if you specifically need structured vendor, date, and total fields in CSV format.',
    },
    {
      q: 'Should I verify the spreadsheet data before using it in calculations?',
      a: 'Yes. The text in a spreadsheet cell is one thing — a slightly wrong word in a product name is easy to spot. A slightly wrong number in a revenue column is not, and if that number feeds into formulas, the error compounds silently. Column alignment is the main thing to check: scan a few rows to make sure values didn\'t shift one column. For tables with totals or subtotals, compare a couple of those against the original image before you build anything on top of the data.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR and spreadsheet creation both run in your browser. Your files never leave your device.',
    },
  ],

  relatedTools: ['receipt-to-text', 'table-image-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Image to Excel Converter — ConvertYard',
    description: 'Extract tables from images into .xlsx spreadsheets. No retyping — screenshot or photo a table, get an Excel file back. Runs locally, no uploads.',
  },
}

import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ConversionResult, ToolConfig, ToolOptions } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-to-excel',
  title: 'Image to Excel Converter',
  subtitle: 'Extract tables from images into .xlsx spreadsheets. No retyping.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.xlsx',
  convertFn: (files: File[], opts: ToolOptions, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'excel' }, onProgress),

  limitationNote: {
    summary: 'OCR-based — spot-check numbers and column alignment',
    body: 'Standard mode uses Tesseract OCR with column detection. Tables with consistent column alignment extract accurately — the thing to spot-check is whether numbers stayed in the right column on tightly-spaced or slightly skewed images. For denser tables or stylized fonts, switch to AI-Enhanced recognition (English only) in the options below — it uses Florence-2 + TrOCR and often reads tricky characters more accurately.',
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
        standard: 'Tesseract OCR with column detection. Best for clean printed text in any language.',
        'ai-enhanced': 'Florence-2 + TrOCR: processes the full page at once, better on dense or stylized fonts. Downloads ~262MB on first use — shared with other OCR tools so may already be cached. English only.',
      },
    },
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Language of text in the table. Standard engine only — AI-Enhanced uses English.',
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
      a: 'The tool uses Tesseract OCR with pixel-level column detection to reconstruct the table grid from the image. Words are assigned to cells based on their horizontal position, and the result is written to .xlsx. This approach cannot invent data — it can only misread a character, never fabricate a row or shuffle a value between columns.',
    },
    {
      q: 'When should I use AI-Enhanced recognition?',
      a: 'Switch to AI-Enhanced when standard OCR misreads characters — common on dense tables, bold or italic headers, or text that runs close together. It uses Florence-2 + TrOCR instead of Tesseract, which handles complex layouts without line-by-line segmentation. Downloads ~262MB on first use (shared with other OCR tools on this site, so it may already be cached). English only.',
    },
    {
      q: 'Can I open the output directly in Excel or Google Sheets?',
      a: 'Yes. The output is a standard .xlsx file — open it directly in Excel, Google Sheets, or LibreOffice Calc.',
    },
    {
      q: 'What types of tables does it handle best?',
      a: 'Bordered tables (with visible grid lines) and borderless tables with consistent column spacing extract most reliably. If column values are very close together or the image has slight skew, spot-check the column alignment after export.',
    },
    {
      q: 'Does it work on invoice or receipt images?',
      a: 'For structured receipts with line items, yes. For receipts where you need vendor, date, and total extracted into specific fields, use the Receipt to Text tool instead.',
    },
    {
      q: 'Should I verify the spreadsheet before using it in calculations?',
      a: 'Yes — especially numbers. Scan a few rows to confirm column alignment, and for tables with totals, spot-check those against the original image before building formulas on top of the data.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. All processing runs entirely in your browser. Your images never leave your device.',
    },
  ],

  relatedTools: ['receipt-to-text', 'table-image-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Image to Excel Converter — ConvertYard',
    description: 'Extract tables from images into .xlsx spreadsheets. Browser-based OCR — no uploads, no account. Batch convert screenshots and photos to Excel in seconds.',
  },
}

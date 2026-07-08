import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'receipt-to-text',
  title: 'Receipt to Text Converter',
  subtitle: 'Extract receipt data into CSV for expense reports. Batch up to 500.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.csv',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'receipt-csv' }, onProgress),

  options: [
    {
      type: 'radio',
      name: 'recognitionEngine',
      label: 'Recognition engine',
      choices: [
        { value: 'standard', label: 'Standard — no download' },
        { value: 'ai-enhanced', label: 'AI-Enhanced — English only, ~262MB (may be cached)' },
      ],
      default: 'standard',
      conditionalHints: {
        standard: 'Tesseract OCR with image preprocessing. Fast, no download needed.',
        'ai-enhanced': 'Florence-2 + TrOCR: processes the full receipt at once, better on faded or printed thermal text. Downloads ~262MB on first use — shared with the Image Description tool so may already be cached. English only.',
      },
    },
  ],

  faq: [
    {
      q: 'What fields does it extract?',
      a: 'Vendor name (first text line), date (first date pattern found), and total amount (last dollar figure or labeled total). The full raw text is also included in the CSV so you can pull any other field manually.',
    },
    {
      q: 'Does it work on thermal receipt paper photos?',
      a: 'Yes. Thermal receipts — the shiny ones from card readers — photograph as light grey text on white. Use a well-lit photo for best contrast.',
    },
    {
      q: 'Can I import the CSV into QuickBooks, FreshBooks, or Xero?',
      a: 'The CSV format is generic and imports into any accounting tool that accepts CSV. Map the vendor, date, and total columns to your tool\'s field names.',
    },
    {
      q: 'How reliable is the extracted data — should I verify before submitting an expense report?',
      a: 'Yes, always verify the totals. Thermal receipt paper (the shiny kind) is one of the hardest inputs for OCR: the ink fades, the contrast is often low, and the text is usually tiny. The tool does its best to find the vendor, date, and total, but a misread digit in an amount is easy to miss and easy to catch in 5 seconds. Totals and dates are the two things most worth a double-check before you submit anything to accounting.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your receipt photos never leave your device.',
    },
  ],

  relatedTools: ['scan-to-text', 'business-card-to-text', 'image-to-excel'],
  relatedArticles: [],

  meta: {
    title: 'Receipt to Text Converter — ConvertYard',
    description: 'Extract vendor, date, and total from receipt photos into CSV. Batch up to 500 receipts locally — no uploads, no account, no subscription.',
  },
}

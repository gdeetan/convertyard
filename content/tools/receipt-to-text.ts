import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'receipt-to-text',
  title: 'Receipt to Text Converter',
  subtitle: 'Extract receipt text and key fields. Download as readable text or CSV. Batch up to 500.',
  bestFor: 'Best for extracting vendor, date, and total from receipt photos for manual expense logging.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(
      files,
      { ...opts, recognitionEngine: 'ai-enhanced', outputMode: 'receipt-csv' },
      onProgress
    ),
  reviewPanel: OcrReviewPanel,

  options: [
    {
      type: 'radio',
      name: 'receiptFormat',
      label: 'Output format',
      choices: [
        { value: 'txt', label: 'Formatted text (.txt)' },
        { value: 'csv', label: 'CSV for spreadsheets (.csv)' },
      ],
      default: 'txt',
      conditionalHints: {
        txt: 'Receipt-style layout: vendor, date, and total at the top, then the full extracted text below.',
        csv: 'One row per receipt with filename, vendor, date, total, and raw text columns. Import into Excel, QuickBooks, or Xero.',
      },
    },
  ],

  faq: [
    {
      q: 'Are my receipt photos uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your receipt photos never leave your device.',
    },
    {
      q: 'What fields does it extract?',
      a: 'Vendor name (first text line), date (first date pattern found), and total amount (last dollar figure or labeled total). The full raw OCR text is also included. In CSV mode, all fields appear as columns — one row per receipt.',
    },
    {
      q: 'Does the output give me a parsed expense report?',
      a: 'No. The output is extracted text with vendor, date, and total detected automatically. It is not a structured expense entry — you still need to review and import the values into your accounting tool manually. Think of it as a first pass that saves you from typing everything out.',
    },
    {
      q: 'Does it work on thermal receipt paper photos?',
      a: 'Yes, but thermal receipts are one of the hardest inputs for OCR — the ink fades, the contrast is low, and the text is usually very small. Take the photo in good natural light with the receipt as flat as possible. Always verify totals before submitting to accounting.',
    },
    {
      q: 'Can I import the CSV into QuickBooks, FreshBooks, or Xero?',
      a: 'Yes — choose CSV output format. The file has filename, vendor, date, total, and raw text columns. Map those to your accounting tool\'s field names on import.',
    },
  ],

  relatedTools: ['scan-to-text', 'business-card-to-text', 'image-to-excel'],
  relatedArticles: [],

  meta: {
    title: 'Receipt to Text Converter — ConvertYard',
    description: 'Extract vendor, date, and total from receipt photos. Download as formatted text or CSV. Batch up to 500 receipts locally — no uploads, no account.',
  },
}

import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'receipt-to-text',
  title: 'Receipt to Text Converter',
  subtitle: 'Extract receipt text and key fields. Download as readable text or CSV. Batch up to 500.',
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
      q: 'What fields does it extract?',
      a: 'Vendor name (first text line), date (first date pattern found), and total amount (last dollar figure or labeled total). In text mode, the full raw OCR text follows below. In CSV mode, all fields appear as columns in one row per receipt.',
    },
    {
      q: 'Does it work on thermal receipt paper photos?',
      a: 'Yes. Thermal receipts — the shiny ones from card readers — photograph as light grey text on white. Use a well-lit photo for best contrast.',
    },
    {
      q: 'Can I import the CSV into QuickBooks, FreshBooks, or Xero?',
      a: 'Yes — choose CSV output format. The file has filename, vendor, date, total, and raw text columns. Map vendor, date, and total to your accounting tool\'s field names.',
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
    description: 'Extract vendor, date, and total from receipt photos. Download as formatted text or CSV. Batch up to 500 receipts locally — no uploads, no account.',
  },
}

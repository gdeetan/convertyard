import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'receipt-to-text',
  title: 'Receipt to Text Converter',
  subtitle: 'Extract receipt data into CSV for expense reports. Batch up to 500.',
  category: 'images',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.csv',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'receipt-csv' }, onProgress),

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

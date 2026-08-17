import { heicToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-pdf',
  title: 'HEIC to PDF Converter',
  subtitle: 'Local-first HEIC to PDF. Built for batches.',
  bestFor: 'Best for turning iPhone photo batches into a single shareable PDF or individual PDFs.',
  category: 'pdf',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.pdf',
  convertFn: heicToPdf,
  enablePresets: true,
  options: [
    {
      type: 'dropdown',
      name: 'outputMode',
      label: 'Output mode',
      choices: [
        { value: 'per-image', label: 'One PDF per image' },
        { value: 'combined', label: 'All images in one PDF' },
      ],
      default: 'per-image',
    },
    {
      type: 'dropdown',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'A4', label: 'A4 (210 × 297mm)' },
        { value: 'Letter', label: 'Letter (8.5 × 11in)' },
        { value: 'fit-to-image', label: 'Fit to image' },
      ],
      default: 'A4',
    },
  ],
  faq: [
    {
      q: 'Are my HEIC photos uploaded to a server?',
      a: 'Never. HEIC decoding and PDF creation both run in your browser. Your photos never leave your device.',
    },
    {
      q: 'What is the difference between the output modes?',
      a: 'One PDF per image creates a separate PDF file for each HEIC photo. All images in one PDF combines all your photos into a single multi-page PDF document.',
    },
    {
      q: 'Will the image quality be preserved?',
      a: 'Yes. HEIC files are decoded to PNG (lossless) before embedding into the PDF, so no additional compression is applied.',
    },
    {
      q: 'Can I convert HEIF files as well as HEIC?',
      a: 'Yes. Both .heic and .heif files are supported — they use the same underlying format.',
    },
    {
      q: 'What does "Fit to image" page size mean?',
      a: 'The PDF page is sized to match the exact pixel dimensions of the image at 72 DPI. Use A4 or Letter if you need a standard paper size for printing.',
    },
  ],
  relatedTools: ['heic-to-jpg', 'heic-to-png', 'jpg-to-pdf', 'compress-pdf'],
  relatedArticles: [],
  meta: {
    title: 'iPhone HEIC to PDF Converter — ConvertYard',
    description: 'Convert HEIC photos to PDF in your browser. Batch convert iPhone photos — one PDF per image or all in one. No uploads, entirely local.',
  },
}

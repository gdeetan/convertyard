import { pdfToJpg } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-jpg',
  title: 'PDF to JPG Converter',
  subtitle: 'Export every PDF page as a JPG image. Built for batches.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.jpg',
  convertFn: pdfToJpg,

  options: [
    {
      type: 'slider',
      name: 'dpi',
      label: 'DPI',
      min: 72,
      max: 300,
      step: 1,
      default: 150,
      hint: '72 DPI for screen, 150 DPI for web/email, 300 DPI for print',
    },
    {
      type: 'slider',
      name: 'quality',
      label: 'JPEG Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 85,
      hint: '85 is the sweet spot — sharp enough for most uses at a reasonable file size',
    },
  ],

  faq: [
    {
      q: 'What DPI should I choose?',
      a: '72 DPI is fine for web thumbnails or quick previews. 150 DPI is a good default for email attachments, presentations, and most online uses — clear and readable without large file sizes. 300 DPI produces print-quality images suitable for physical printing or professional workflows. Higher DPI means larger files and slower processing.',
    },
    {
      q: 'How does a multi-page PDF export?',
      a: 'Each page becomes a separate JPG file. The files are named using your original PDF name followed by the page number — for example, a file called "report.pdf" exports as "report-page-1.jpg", "report-page-2.jpg", and so on. All pages download together in a single ZIP.',
    },
    {
      q: 'Will text in the PDF be readable in the exported JPGs?',
      a: 'Yes, as long as you use a sufficient DPI. At 150 DPI, standard body text is clearly legible. Small text (footnotes, captions) may need 200–300 DPI to remain sharp. JPEG compression can also soften fine text — use quality 85 or higher to preserve readability.',
    },
    {
      q: 'Can I convert just one page from a multi-page PDF?',
      a: 'The current tool exports all pages. To convert a single page, use Split PDF first to extract that page into its own PDF, then convert it here.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Rendering happens entirely in your browser using WebAssembly. Your PDFs never leave your device — no upload, no account.',
    },
    {
      q: 'What is the difference between PDF to JPG and PDF to PNG?',
      a: 'JPG uses lossy compression — smaller files, perfect for photos and scanned documents. PNG uses lossless compression — larger files, but every pixel is preserved exactly. For most PDFs containing text or mixed content, JPG at quality 85+ looks identical to PNG but at a fraction of the size.',
    },
  ],

  relatedTools: ['compress-pdf', 'merge-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to JPG Converter — ConvertYard',
    description:
      'Convert PDF pages to JPG images in your browser. Choose DPI and quality. Batch convert 1,000 files — no uploads, no account, entirely local.',
  },
}

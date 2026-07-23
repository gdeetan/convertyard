import { epubToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'epub-to-pdf',
  title: 'EPUB to PDF Converter',
  subtitle: 'Local-first EPUB conversion. Built for batches.',
  bestFor: 'Best for converting ebooks to PDF for printing or reading in PDF viewers.',
  category: 'pdf',
  accepts: ['application/epub+zip'],
  acceptsExt: ['.epub'],
  outputExt: '.pdf',
  convertFn: epubToPdf,
  options: [
    {
      type: 'dropdown',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'A4', label: 'A4 (210 × 297mm)' },
        { value: 'Letter', label: 'Letter (8.5 × 11in)' },
      ],
      default: 'A4',
    },
    {
      type: 'slider',
      name: 'fontSize',
      label: 'Font size (pt)',
      min: 8,
      max: 18,
      step: 1,
      default: 12,
    },
  ],
  faq: [
    {
      q: 'Are my EPUB files uploaded to a server?',
      a: 'Never. EPUB parsing and PDF rendering both run entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'Are images from the EPUB included in the output PDF?',
      a: 'No. This tool produces text-only PDFs. Images, decorative graphics, and custom CSS layouts are not rendered. Only the textual content of chapters is included.',
    },
    {
      q: 'Will the chapter order match the original?',
      a: 'Yes. Chapters are rendered in the order defined by the EPUB spine, which matches the reading order set by the author.',
    },
    {
      q: 'What fonts does the output use?',
      a: 'The PDF uses standard built-in fonts: Times Roman for headings, Helvetica for body text, and Courier for code. Custom fonts from the EPUB are not embedded.',
    },
    {
      q: 'Can I convert multiple EPUBs at once?',
      a: 'Yes. Drop as many .epub files as you like — each gets its own PDF.',
    },
  ],
  relatedTools: ['markdown-to-pdf', 'compress-pdf', 'pdf-to-text', 'pdf-to-word'],
  relatedArticles: [],
  meta: {
    title: 'EPUB to PDF Converter — ConvertYard',
    description:
      'Convert EPUB ebooks to PDF in your browser. Batch convert 1000 files at once — no uploads, no account, entirely local.',
  },
}

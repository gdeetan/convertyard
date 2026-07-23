import { markdownToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'markdown-to-pdf',
  title: 'Markdown to PDF Converter',
  subtitle: 'Local-first Markdown conversion. Built for batches.',
  bestFor: 'Best for converting documentation, README files, and notes to shareable PDFs.',
  category: 'pdf',
  accepts: ['text/markdown', 'text/x-markdown', 'text/plain'],
  acceptsExt: ['.md', '.markdown'],
  outputExt: '.pdf',
  convertFn: markdownToPdf,
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
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion happens entirely in your browser. Your Markdown files never leave your device.',
    },
    {
      q: 'What Markdown features are supported?',
      a: 'Headings (H1–H3), bold, italic, inline code, code blocks, bullet lists, numbered lists, horizontal rules, and blockquotes. Images and HTML are not rendered.',
    },
    {
      q: 'Can I convert multiple files at once?',
      a: 'Yes. Drop as many .md files as you like — each gets its own PDF.',
    },
    {
      q: 'Why does the output use basic fonts?',
      a: 'The PDF uses standard fonts (Times, Helvetica, Courier) that are built into every PDF reader. This keeps file sizes small and avoids font embedding overhead.',
    },
    {
      q: 'Can I control the page size?',
      a: 'Yes. Choose between A4 (standard international) and Letter (US standard) using the page size option.',
    },
  ],
  relatedTools: ['csv-to-pdf', 'epub-to-pdf', 'compress-pdf', 'pdf-to-text'],
  relatedArticles: [],
  meta: {
    title: 'Markdown to PDF Converter — ConvertYard',
    description:
      'Convert Markdown files to PDF in your browser. Batch convert up to 1000 .md files at once. No uploads, no account — entirely local.',
  },
}

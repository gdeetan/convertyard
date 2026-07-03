import { tiffToPdfConvert } from '@/lib/converters/tiff-to-pdf-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-pdf',
  title: 'TIFF to PDF Converter',
  subtitle: 'Bundle scanned TIFFs into PDF. Page order follows filename order.',
  category: 'pdf',
  accepts: ['image/tiff', 'image/x-tiff'],
  acceptsExt: ['.tiff', '.tif'],
  outputExt: '.pdf',
  convertFn: (files, opts, onProgress) => tiffToPdfConvert(files, opts, onProgress),

  options: [
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output',
      choices: [
        { value: 'separate', label: 'One PDF per TIFF' },
        { value: 'combine', label: 'Combine into one PDF' },
      ],
      default: 'separate',
      conditionalHints: {
        separate: 'Each TIFF becomes its own PDF file.',
        combine: 'All TIFFs are merged into a single PDF, sorted by filename. Name files 001.tiff, 002.tiff, etc. for correct page order.',
      },
    },
  ],

  faq: [
    {
      q: 'Can multiple TIFFs become a single multi-page PDF?',
      a: 'Yes. Set output to "Combine into one PDF" and drop all your TIFFs. Pages are sorted by filename — name them sequentially (001.tiff, 002.tiff, etc.) for the correct order.',
    },
    {
      q: 'Does it preserve the TIFF resolution in the PDF?',
      a: 'Yes. The TIFF\'s pixel dimensions are preserved when embedded as a PDF page. The output is a standard page-per-scan PDF.',
    },
    {
      q: 'Is it suitable for legal document submission?',
      a: 'The output is a standard PDF/1.7 file. Check with the receiving court or system for their specific requirements — some require PDF/A for archival purposes.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion runs in your browser — your TIFFs never leave your device.',
    },
  ],

  relatedTools: ['tiff-to-jpg', 'tiff-to-png', 'jpg-to-pdf'],
  relatedArticles: [],

  meta: {
    title: 'TIFF to PDF Converter — ConvertYard',
    description: 'Convert TIFF scans to PDF for legal, medical, and archival workflows. Combine multiple TIFFs into one PDF. Runs locally — no uploads.',
  },
}

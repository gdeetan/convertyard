import { tiffToPdfConvert } from '@/lib/converters/tiff-to-pdf-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-pdf',
  title: 'TIFF to PDF Converter',
  subtitle: 'Bundle scanned TIFFs into PDF. Page order follows filename order.',
  bestFor: 'Best for converting scanner output from legal, medical, or archival workflows into PDF.',
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
      q: 'Are my TIFF files uploaded to your servers?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your TIFFs never leave your device.',
    },
    {
      q: 'Can multiple TIFFs become a single multi-page PDF?',
      a: 'Yes. Set output to "Combine into one PDF" and drop all your TIFFs. Pages are sorted by filename — name them sequentially (001.tiff, 002.tiff, etc.) to control the page order.',
    },
    {
      q: 'Does conversion preserve the original TIFF resolution?',
      a: 'Yes. The pixel dimensions of each TIFF are preserved exactly when embedded as a PDF page. No downscaling or resampling is applied unless your TIFF contains resolution metadata that the PDF embeds as DPI hints.',
    },
    {
      q: 'Why does my multi-page TIFF only produce one page in the PDF?',
      a: 'Multi-page TIFF files (where multiple scans are packed into one .tiff) are treated as a single image using the first frame only. To convert all frames, export each frame as a separate TIFF file first, then combine them here.',
    },
    {
      q: 'Is the output suitable for legal or archival submission?',
      a: 'The output is a standard PDF/1.7 file. Some workflows require PDF/A for long-term archival — check the requirements of the receiving system. PDF/A conversion is not currently available in this tool.',
    },
  ],

  relatedTools: ['tiff-to-jpg', 'tiff-to-png', 'jpg-to-pdf'],
  relatedArticles: [],

  meta: {
    title: 'TIFF to PDF Converter — Bundle Scans — ConvertYard',
    description: 'Convert TIFF scans to PDF for legal, medical, and archival workflows. Combine multiple TIFFs into one PDF. Runs locally — no uploads.',
  },
}

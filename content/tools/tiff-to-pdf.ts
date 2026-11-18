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
      a: 'Yes. To convert all TIFFs into a single PDF, set the output to &ldquo;Combine into one PDF,&rdquo; then drop all your TIFFs into the tool. Pages are sorted by filename, so make sure you have named them sequentially (e.g., 001.tiff, 002.tiff, etc.).',
    },
    {
      q: 'Does conversion preserve the original TIFF resolution?',
      a: 'Yes. All TIFFs are converted to PDF, and the pixel dimensions are preserved. The only exception is if the TIFF contains resolution metadata, which will then be used as DPI hints by the PDF.',
    },
    {
      q: 'Why does my multi-page TIFF only produce one page in the PDF?',
      a: 'Files containing multiple pages (so-called multi-page TIFFs) will be embedded as single images using the first frame only. In order to include all frames in your output, you will have to export them as separate TIFF files first and then import them here.',
    },
    {
      q: 'Is the output suitable for legal or archival submission?',
      a: 'The output is simply a standard PDF/1.7 file. Although many workflows can make do with this, PDF/A might be required for long-term archival purposes. However, this is not currently possible with this tool. Check with the receiving system for requirements.',
    },
  ],

  relatedTools: ['tiff-to-jpg', 'tiff-to-png', 'jpg-to-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Convert TIFF Images to PDF Documents - Nothing Uploads, No Signup',
    description: 'Convert legacy TIFF files into sharable PDF documents in your browser. Batch convert up to 1000 files per cycle for free, no signup, no uploads.',
  },
}

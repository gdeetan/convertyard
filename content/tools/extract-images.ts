import { extractImages } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'extract-images',
  title: 'Extract Images from PDF',
  subtitle: 'Pull embedded images or render pages as PNG. Output is a ZIP. All processing happens in your browser.',
  bestFor: 'Best for pulling photos out of a scanned report, brochure, or photo book PDF.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.zip',
  convertFn: extractImages,
  enablePresets: true,

  options: [
    {
      type: 'radio',
      name: 'mode',
      label: 'Extraction mode',
      choices: [
        { value: 'embedded',  label: 'Extract embedded images (JPEG)' },
        { value: 'rasterize', label: 'Render pages as PNG' },
      ],
      default: 'embedded',
      conditionalHints: {
        embedded:  'Pulls JPEG images stored inside the PDF without re-encoding. Fast and lossless. Only works if the PDF contains embedded JPEG images.',
        rasterize: 'Renders each page to a PNG at the chosen DPI. Works on any PDF — scanned, vector, or mixed.',
      },
    },
    {
      type: 'slider',
      name: 'dpi',
      label: 'Render DPI',
      min: 72,
      max: 300,
      step: 1,
      default: 150,
      hint: '150 DPI is good for screen use. Use 300 DPI for print-quality output.',
      dependsOn: { name: 'mode', value: 'rasterize' },
    },
  ],

  limitationNote: {
    summary: 'When to use each mode',
    body: 'Use "Extract embedded images" for PDFs that contain photos (scanned documents, brochures). It pulls JPEG files directly without re-encoding. Use "Render pages as PNG" for any other PDF — it rasterizes each page at the DPI you choose.',
  },

  faq: [
    {
      q: 'Does extracting images upload my PDF?',
      a: 'No. Everything runs in your browser using WebAssembly. Your PDF never leaves your device.',
    },
    {
      q: 'What is the difference between the two extraction modes?',
      a: '"Extract embedded images" reads the raw JPEG streams stored inside the PDF and saves them directly — no re-encoding, no quality loss. "Render pages as PNG" draws each page onto a canvas and exports it as a PNG, which works even for text-only or vector PDFs.',
    },
    {
      q: 'Why does the embedded mode say "no images found"?',
      a: 'The PDF does not contain embedded JPEG images. This is common for text-only PDFs or files created from vector graphics. Switch to "Render pages as PNG" mode to get images of each page.',
    },
    {
      q: 'What format are the extracted images?',
      a: 'Embedded mode outputs JPEG files (.jpg). Rasterize mode outputs PNG files (.png). All files are packaged in a ZIP.',
    },
    {
      q: 'Can I extract images from multiple PDFs at once?',
      a: 'Yes. Drop multiple PDFs — each produces its own ZIP file in the results.',
    },
    {
      q: 'What DPI should I use in rasterize mode?',
      a: '150 DPI is good for screen viewing and web use. Use 300 DPI if you need print-quality output. Higher DPI means larger file sizes and slower processing.',
    },
  ],

  relatedTools: ['pdf-to-png', 'pdf-to-jpg', 'extract-pages', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Extract Images from PDF — ConvertYard',
    description:
      'Extract embedded JPEG images from a PDF or render every page as PNG. Output is a ZIP. Batch 1,000 files — no uploads, no account.',
  },
}

import { imagesToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-pdf',
  title: 'JPG to PDF Converter',
  subtitle: 'Combine images into a PDF or create one PDF per image. Built for batches.',
  category: 'pdf',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'],
  outputExt: '.pdf',
  convertFn: imagesToPdf,

  options: [
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output',
      choices: [
        { value: 'all-in-one',    label: 'All images in one PDF' },
        { value: 'one-per-image', label: 'One PDF per image' },
      ],
      default: 'all-in-one',
      conditionalHints: {
        'all-in-one':    'Combine all images into a single PDF. Drag images to set page order.',
        'one-per-image': 'Each image becomes its own PDF file.',
      },
    },
    {
      type: 'radio',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'fit-to-image', label: 'Fit to image' },
        { value: 'a4',           label: 'A4' },
        { value: 'letter',       label: 'US Letter' },
      ],
      default: 'fit-to-image',
      conditionalHints: {
        'fit-to-image': 'Each page matches the image dimensions exactly.',
        a4:             'Images are scaled to fit A4 pages with a 0.5 inch margin.',
        letter:         'Images are scaled to fit US Letter pages with a 0.5 inch margin.',
      },
    },
    {
      type: 'radio' as const,
      name: 'orientation',
      label: 'Orientation',
      choices: [
        { value: 'auto',      label: 'Auto' },
        { value: 'portrait',  label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
      default: 'auto',
      hint: 'Auto matches image orientation. Only applies to A4 and US Letter page sizes.',
    },
  ],

  faq: [
    {
      q: 'How do I set the order of images in the PDF?',
      a: 'Drag the image rows up or down in the list before clicking Convert. The order shown is the order they appear in the PDF.',
    },
    {
      q: 'What image formats are supported?',
      a: 'JPG, PNG, WebP, GIF, and HEIC/HEIF (from iPhone/iPad). JPEG images are embedded directly. All other formats are decoded to PNG before embedding to ensure full compatibility.',
    },
    {
      q: 'What does "Fit to image" page size do?',
      a: 'Each page in the PDF is sized exactly to match the dimensions of the image. This preserves every pixel without scaling or margins. A 1920×1080 image becomes a 1920×1080 PDF page.',
    },
    {
      q: 'Can I convert one image per page into separate PDFs?',
      a: 'Yes. Choose "One PDF per image" and each image produces its own PDF file. They all download as a ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. All image embedding runs in your browser via WebAssembly and the Web Canvas API. Your images never leave your device.',
    },
    {
      q: 'What is the maximum number of images I can combine?',
      a: 'There is no hard limit imposed by the tool — it depends on your device memory. Hundreds of images work without issue. For very large batches (1000+), use the "One PDF per image" mode to avoid a single oversized output file.',
    },
  ],

  relatedTools: ['pdf-to-jpg', 'pdf-to-png', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'JPG to PDF Converter — ConvertYard',
    description: 'Convert JPG, PNG, and WebP images to PDF in your browser. Combine into one PDF or create one per image. Drag to reorder. No uploads, no account.',
  },
}

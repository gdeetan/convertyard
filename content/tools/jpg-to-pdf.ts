import { imagesToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-pdf',
  title: 'JPG to PDF Converter',
  subtitle: 'Combine photos into one PDF or create one PDF per image. Drag to reorder pages. No upload required.',
  bestFor: 'Best for packaging photos or screenshots into a single document to send by email.',
  category: 'pdf',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'],
  outputExt: '.pdf',
  convertFn: imagesToPdf,
  enablePresets: true,

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
      q: 'Are my photos uploaded to your servers during conversion?',
      a: 'No. All image embedding runs in your browser via WebAssembly and the Web Canvas API. Your images never leave your device.',
    },
    {
      q: 'What image formats are supported?',
      a: 'JPG, PNG, WebP, GIF, and HEIC/HEIF (from iPhone/iPad). JPEG images are embedded directly. All other formats are decoded to PNG before embedding to ensure compatibility.',
    },
    {
      q: 'How do I set the order of images in the PDF?',
      a: 'Drag the image rows up or down in the list before clicking Convert. The order shown is the order they appear in the PDF.',
    },
    {
      q: 'What does "Fit to image" page size do?',
      a: 'Each page in the PDF is sized exactly to match the image dimensions. This preserves every pixel without scaling or margins. A 1920×1080 image becomes a 1920×1080 PDF page. Use A4 or Letter if you need consistent page sizes for printing.',
    },
    {
      q: 'What happens to HEIC photos from iPhone?',
      a: 'HEIC files are decoded to a rasterised format in the browser before embedding. The conversion is lossless within the resolution of the original file. HEIC decoding may take longer than JPEG for the same file size.',
    },
    {
      q: 'Why is my combined PDF very large?',
      a: 'Each image is embedded at its original resolution. A batch of 20 photos at 4MB each produces roughly an 80MB PDF. If you need a smaller file, compress the images before converting or use Compress PDF on the output.',
    },
  ],

  relatedTools: ['pdf-to-jpg', 'pdf-to-png', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'JPG to PDF Converter — ConvertYard',
    description: 'Convert JPG, PNG, and WebP images to PDF. One image per page, or combine them. Drag to reorder. Runs in your browser — nothing is uploaded. Print-ready.',
  },
}

import { imagesToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-pdf',
  title: 'PNG to PDF Converter',
  subtitle: 'Combine PNG images into a PDF or create one PDF per image. Browser-only.',
  bestFor: 'Best for turning screenshots or diagrams into a shareable PDF without losing image quality.',
  category: 'pdf',
  accepts: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
  acceptsExt: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif'],
  outputExt: '.pdf',
  convertFn: imagesToPdf,
  enablePresets: true,
  options: [
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output',
      choices: [
        { value: 'all-in-one', label: 'All images in one PDF' },
        { value: 'one-per-image', label: 'One PDF per image' },
      ],
      default: 'all-in-one',
      conditionalHints: {
        'all-in-one': 'Combine all images into a single PDF. Drag images to set page order.',
        'one-per-image': 'Each image becomes its own PDF file.',
      },
    },
    {
      type: 'radio',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'fit-to-image', label: 'Fit to image' },
        { value: 'a4', label: 'A4' },
        { value: 'letter', label: 'US Letter' },
      ],
      default: 'fit-to-image',
      conditionalHints: {
        'fit-to-image': 'Each page matches the image dimensions exactly.',
        a4: 'Images are scaled to fit A4 pages with a 0.5 inch margin.',
        letter: 'Images are scaled to fit US Letter pages with a 0.5 inch margin.',
      },
    },
    {
      type: 'radio',
      name: 'orientation',
      label: 'Orientation',
      choices: [
        { value: 'auto', label: 'Auto' },
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
      default: 'auto',
      hint: 'Auto matches image orientation. Only applies to A4 and US Letter.',
    },
  ],
  faq: [
    {
      q: 'Are my PNG files uploaded to your servers?',
      a: 'Never. All image embedding runs in your browser via WebAssembly. Your images never leave your device.',
    },
    {
      q: 'What happens to PNG transparency?',
      a: 'Transparent areas are rendered on a white background in the PDF. PDFs do not support page-level transparency — there is no way to preserve a transparent background in the output.',
    },
    {
      q: 'Will the PNG image quality be preserved in the PDF?',
      a: 'Yes. PNGs are embedded as-is using lossless encoding. No JPEG recompression is applied, so there is no quality loss. The pixel dimensions are preserved exactly when using "Fit to image" page size.',
    },
    {
      q: 'Can I combine PNGs and JPGs in the same PDF?',
      a: 'Yes. This tool accepts PNG, JPG, WebP, GIF, and HEIC files in the same batch. Drag them into the list in any order before converting.',
    },
    {
      q: 'How do I control the page order?',
      a: 'Drag the image rows up or down in the list before clicking Convert. The order shown is the order they appear as pages in the PDF.',
    },
    {
      q: 'Why is my PDF very large after converting PNGs?',
      a: 'PNGs are embedded losslessly, so a high-resolution PNG becomes a high-resolution page in the PDF with no size reduction. If the file is too large, compress the PNGs first or run the output through Compress PDF.',
    },
  ],
  relatedTools: ['jpg-to-pdf', 'merge-pdf', 'compress-pdf', 'pdf-to-png'],
  relatedArticles: [],
  meta: {
    title: 'PNG to PDF Converter — ConvertYard',
    description: 'Convert PNG images to PDF in your browser. Combine multiple PNGs into one PDF or create one per image. Batch convert up to 1,000 files. No upload.',
  },
}

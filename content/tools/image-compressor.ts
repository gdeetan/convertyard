import { imageCompress } from '@/lib/converters/image-compress'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-compressor',
  title: 'Bulk Image Compressor',
  subtitle: 'Local-first image compression. Built for batches.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '',
  convertFn: (files, opts, onProgress) => imageCompress(files, opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 is the sweet spot — visually identical at a fraction of the size. For PNG, this controls compression level.',
    },
    {
      type: 'number',
      name: 'maxSizeKb',
      label: 'Max file size (KB)',
      min: 0,
      max: 100000,
      step: 1,
      default: 0,
      hint: '0 = disabled. For JPG and WebP, quality is reduced until the file fits. PNG size is not guaranteed.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF, GPS, and camera data — smaller files, more privacy',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation on phone photos using EXIF data',
    },
  ],

  faq: [
    {
      q: 'Does compression reduce image dimensions?',
      a: 'No. This tool only changes file size by re-encoding at a lower quality level. The width and height of your images stay exactly the same. If you need to resize, use the Batch Image Resizer.',
    },
    {
      q: 'What quality setting should I use?',
      a: 'For web images, 75–85 is the standard range. At 80, most viewers cannot see a difference from the original. Below 60, compression artifacts become visible in photos. For logos, diagrams, and images with text or sharp edges, use 85–95.',
    },
    {
      q: 'Why does PNG compression look different from JPG?',
      a: "PNG is a lossless format — it never degrades pixel data. The quality slider for PNGs controls the compression algorithm's effort level, not visual quality. A PNG at \"quality 50\" looks identical to one at \"quality 100\" — only the processing time and file size differ slightly. For significant PNG size reduction, consider converting to WebP.",
    },
    {
      q: 'How does the "Max file size" target work?',
      a: 'For JPG and WebP files, the tool starts at your chosen quality and compresses again at quality minus 10, repeating until the file is under your target size. It stops at quality 20 to avoid unusable output. For PNG files, the lossless nature means size reduction is limited — stripping metadata helps more than adjusting quality.',
    },
    {
      q: 'Does lossy compression accumulate if I compress twice?',
      a: "Yes, compressing a JPG more than once degrades quality each time. For archival workflows, always compress from the original file. This tool processes your local files and outputs new files — your originals are never modified.",
    },
    {
      q: 'Are my images uploaded to your servers?',
      a: "Never. All compression runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code — they never see your images.",
    },
  ],

  relatedTools: ['image-resizer', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'Bulk Image Compressor — ConvertYard',
    description:
      'Compress JPG, PNG, and WebP images in bulk. Set quality or target file size. Batch up to 1,000 files — all processing in your browser, no uploads, no account.',
  },
}

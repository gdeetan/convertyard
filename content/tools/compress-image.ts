import { imageCompress } from '@/lib/converters/image-compress'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-image',
  title: 'Image Compressor',
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
      type: 'number-with-chips',
      name: 'maxSizeKb',
      label: 'Max file size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'KB',
      chips: [
        { label: '20 KB',  valueKB: 20   },
        { label: '50 KB',  valueKB: 50   },
        { label: '100 KB', valueKB: 100  },
        { label: '200 KB', valueKB: 200  },
        { label: '500 KB', valueKB: 500  },
        { label: '1 MB',   valueKB: 1024 },
        { label: '2 MB',   valueKB: 2048 },
      ],
      min: 0,
      default: 0,
      hint: '0 = no limit. Quality is reduced first; if still over target, dimensions shrink up to 50%.',
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
      q: 'How does target-size compression work?',
      a: 'When a max file size is set, the tool first reduces quality in steps of 10 (from your chosen quality down to 20). If the file is still over target at quality 20, it then reduces the image dimensions by 10% per step, stopping at 50% of the original size. The smallest file achieved is returned — even if the target could not be fully reached.',
    },
    {
      q: 'Why does my image look softer at very small targets?',
      a: 'Very aggressive compression requires both lower quality and smaller dimensions. At quality 20 the encoder introduces visible artifacts, and at 50% dimensions fine detail is lost. If sharpness matters more than file size, raise the target or accept a larger output file.',
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
  relatedArticles: ['compress-images-without-losing-quality', 'webp-vs-avif-vs-jpeg', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'Image Compressor — ConvertYard',
    description:
      'Compress JPG, PNG, and WebP images in bulk. Set quality or target file size. Batch up to 1,000 files — all processing in your browser, no uploads, no account.',
  },
}

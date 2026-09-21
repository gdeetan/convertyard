import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'
import { WebpToJpgExplainer } from '@/components/webp-to-jpg/explainer'

export const config: ToolConfig = {
  slug: 'webp-to-jpg',
  title: 'WebP to JPG Converter',
  subtitle: 'WebP to universal JPG — compatible with every app, OS, and platform. Batch 1,000+ files at once.',
  bestFor: 'Best for converting WebP into JPG format for apps, websites, portals, or CMS software that still reject WebP files.',
  explainer: WebpToJpgExplainer,
  category: 'images',
  accepts: ['image/webp'],
  acceptsExt: ['.webp'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'jpg', opts, onProgress, onResult),
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 90,
      hint: '90 produces excellent quality JPGs compatible with every app and service',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation using EXIF data',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: 'Downscales the longer edge. 0 = keep original size. Never upscales.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and color profile data — smaller files, more privacy',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful if JPG looks softer than the source WebP',
    },
  ],

  faq: [
    {
      q: 'Why would I convert WebP to JPG?',
      a: 'Since WebP images have almost perfect browser support, there are, however, many non-browser applications that still cannot open WebP images, such as older versions of Adobe Photoshop and Lightroom, Windows Photo Viewer, most email clients, etc. In order to make images that you upload online universally openable, it is often best to convert them to JPG.',
    },
    {
      q: 'Does Safari support WebP now?',
      a: 'Yes. Safari added WebP support in Safari 14 (released September 2020) for iOS and macOS devices. Support for WebP images should now work for virtually all modern Apple devices. However, many older iPhones and Macs still won\'t support WebP images because they don\'t run Safari 14 or later. These users will safely open JPG images instead.',
    },
    {
      q: 'Does converting WebP to JPG lose quality?',
      a: 'Typically it depends on the original WebP file (lossless or lossy compressed). If the original was lossless, then converting to JPG at quality 90 will introduce some slight but theoretically measurable degradation (not perceivable in practice). If the original WebP was already lossy compressed, then re-compressing it to JPG introduces some slight degradation as well (due to second compression) — but this can be kept very minimal by choosing a higher quality setting, e.g. 95+.',
    },
    {
      q: 'Can I convert 1,000 WebP files at once?',
      a: 'Yes, all of them! Drop them all in there, and ConvertYard will process them in your browser. Download them all in a ZIP file when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never, because the conversion takes place in your browser, and Conversion never sees your image files. We simply deliver the tool to your browser as a WebAssembly module, which runs the conversion for you locally.',
    },
  ],

  relatedTools: ['webp-to-png', 'jpg-to-webp', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'WebP to JPG Converter — ConvertYard',
    description:
      'Convert WebP to JPG for universal compatibility. Batch up to 1,000 files locally in your browser — no uploads, no account. Quality control and resize included.',
  },
}

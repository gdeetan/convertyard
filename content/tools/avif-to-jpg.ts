import { libvipsConvert } from '@/lib/converters/libvips'
import { JpgConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-jpg',
  title: 'AVIF to JPG Converter',
  subtitle: 'AVIF is excellent for the web but doesn’t have universal compatibility. JPG is the format that still plays everywhere — CMS uploads, email, print labs, and older devices. Convert your AVIFs to JPG without uploading a single file to a server.',
  bestFor: 'For web designers, e-commerce store owners, and anyone handing AVIF web images off to a designer, platforms, or print shops that still expect JPG.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'jpg', opts, onProgress, onResult),
  previewPanel: JpgConversionPreview,
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
      hint: '90 preserves the visual fidelity of your AVIF source with minimal JPG overhead',
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
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Corrects rotation using EXIF orientation data',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF, GPS, and camera data — smaller files, more privacy',
    },
  ],

  faq: [
    {
      q: 'Are my AVIF files uploaded to convert them?',
      a: "No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images.",
    },
    {
      q: 'Why would I convert AVIF back to JPG?',
      a: "AVIF has growing browser support, and it was built for this purpose - smaller images without losing the quality of high-resolution photos. However, older software, CMS platforms, email clients, and print shops often don’t support this format. JPG is a universally accepted format, so you can send it to anyone and they won’t have issues opening it. If you’re sending an image, for example, to an iPhone or Mac user, you may want to convert it to JPG first to ensure that they won’t have any issues opening that photo.",
    },
    {
      q: 'What do I lose going from AVIF to JPG?',
      a: 'AVIF supports HDR, wide color gamut (Display P3), and transparency — none of these survive in JPG. HDR content gets tone-mapped to standard range, transparency is filled with white, and wide-gamut colors are clipped to sRGB. For standard sRGB web images, the output is visually identical at quality 90.',
    },
    {
      q: 'Will converting AVIF to JPG lose quality?',
      a: 'Yes, expect quality loss when saving to JPG, especially at lower quality settings. However, at quality 90, the difference isn’t noticeable. If you’re converting AVIF to JPG and back to AVIF, each conversion compounds the quality loss.',
    },
    {
      q: 'Does this work with AVIF files created on iPhone?',
      a: "Take note that iPhone’s default is to save photos in HEIC format, not AVIF. So if you’re converting iPhone photos, you’ll need to use the HEIC-to-JPG converter instead of this. AVIF is a purpose-built web-delivery format made for browsers and not a camera capture format.",
    },
  ],

  relatedTools: ['jpg-to-avif', 'avif-to-png', 'webp-to-jpg'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'avif-browser-support', 'batch-convert-images'],

  meta: {
    title: 'AVIF to JPG Converter — ConvertYard',
    description:
      "Convert AVIF files to JPG without uploading your images to a server. Batch convert up to 1,000 files. There's no paywall, no signup, no watermarks. Users can adjust JPG quality, remove metadata, and resize a whole batch of images.",
  },
}

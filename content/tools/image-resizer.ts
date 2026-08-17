import { imageResize } from '@/lib/converters/image-resize'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-resizer',
  title: 'Batch Image Resizer',
  subtitle: 'Resize to exact pixels or let aspect ratio calculate the other dimension. One setting, 1,000 files, one ZIP.',
  bestFor: 'Best for resizing product photos, social media images, or email attachments in bulk before upload.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '',
  convertFn: (files, opts, onProgress) => imageResize(files, opts, onProgress),
  enablePresets: true,

  options: [
    {
      type: 'number',
      name: 'width',
      label: 'Width (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: '0 = auto-calculate from height and aspect ratio',
    },
    {
      type: 'number',
      name: 'height',
      label: 'Height (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: '0 = auto-calculate from width and aspect ratio',
    },
    {
      type: 'dropdown',
      name: 'fit',
      label: 'Fit mode',
      choices: [
        { value: 'contain', label: 'Contain — fit within bounds, keep proportions' },
        { value: 'cover', label: 'Cover — fill bounds, crop from centre' },
        { value: 'fill', label: 'Fill — stretch to exact size' },
        { value: 'inside', label: 'Inside — shrink only, never enlarge' },
      ],
      default: 'contain',
      hint: 'How to handle images that do not match the exact target dimensions',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation on phone photos using EXIF data',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF, GPS, and camera data',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen after resize',
      default: false,
      hint: 'Adds a mild sharpening pass — useful when downscaling makes edges look soft',
    },
  ],

  faq: [
    {
      q: 'What is the difference between Contain, Cover, Fill, and Inside?',
      a: 'Contain scales the image to fit within your target dimensions while keeping proportions — the image may be smaller than the target if aspect ratios differ. Cover scales to fill the target completely and crops the excess from the centre. Fill stretches to exactly match the target, which may distort the image. Inside is like Contain but never upscales — small images stay at their original size.',
    },
    {
      q: 'Will it upscale small images?',
      a: "It depends on the fit mode. Contain and Cover will upscale if the source is smaller than the target. Inside will not — it only shrinks. Fill always produces the exact target size regardless of whether that means upscaling or downscaling.",
    },
    {
      q: 'If I only set width, what happens to height?',
      a: "Height is calculated automatically from the image's aspect ratio. A 2000×1000 image resized to width 800 will output at 800×400. The same works in reverse — set only height and width calculates automatically.",
    },
    {
      q: 'Does resizing change the file format?',
      a: 'No. A JPG stays a JPG, a PNG stays a PNG, and a WebP stays a WebP. Only the dimensions change. If you also want to convert the format, use one of the format converter tools after resizing.',
    },
    {
      q: 'Does resizing change DPI or PPI?',
      a: 'The pixel dimensions change, but the DPI metadata embedded in the file is preserved unless you enable Strip Metadata. Whether an image "looks" larger or smaller on screen depends on the display, not the DPI tag — DPI is only meaningful when printing.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. All resizing happens in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['image-cropper', 'compress-image', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images', 'best-webp-quality'],

  meta: {
    title: 'Image Resizer in Your Browser — ConvertYard',
    description:
      'Resize JPG, PNG, and WebP images in bulk. Set width, height, and fit mode. Batch up to 1,000 files — all processing in your browser, no uploads.',
  },
}

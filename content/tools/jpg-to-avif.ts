import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-avif',
  title: 'JPG to AVIF Converter',
  subtitle: 'AVIF compresses 30–50% better than JPG at the same quality. Convert your archive without uploading a single file.',
  bestFor: 'Best for web developers converting JPG photo libraries to AVIF to cut page weight on image-heavy sites.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'avif', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 70,
      hint: '70 is the AVIF sweet spot — visually identical to JPG at roughly half the size',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Compression effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 9 = smallest file (slower). AVIF encoding is thorough — larger files may take a few seconds.',
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
      hint: 'Fixes rotation on phone photos using EXIF data',
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
      q: 'What is AVIF and why should I use it?',
      a: 'AVIF (AV1 Image File Format) is a modern image format developed by the Alliance for Open Media. It delivers significantly smaller file sizes than both JPG and WebP at the same visual quality — typically 40–60% smaller than an equivalent JPG. It supports HDR, wide color gamut, transparency, and animation. For web use, AVIF is the current best-in-class format for photographs.',
    },
    {
      q: 'Does converting JPG to AVIF reduce quality?',
      a: 'At the default quality of 70, AVIF looks visually identical to JPG — the format is simply more efficient. AVIF quality 70 is roughly equivalent to JPG quality 85 in perceptual terms. You would only notice degradation at very low quality settings (below 40). For archiving or further editing, keep your original JPGs; for web delivery, AVIF at 70 is excellent.',
    },
    {
      q: 'What browsers support AVIF?',
      a: 'AVIF is supported in Chrome (since v85, August 2020), Firefox (since v93, October 2021), Edge (since v121), and Safari (since v16.4, March 2023). That covers over 93% of global web traffic. Android and iOS browsers also support AVIF. The main gap is older iOS/Safari versions — if you need to support Safari 15 or earlier, serve WebP with AVIF as the preferred format using a <picture> element.',
    },
    {
      q: 'When should I choose AVIF over WebP?',
      a: 'Choose AVIF when file size is the priority and you can accept slower encoding. AVIF compresses 15–30% better than WebP at equivalent quality, making it ideal for image-heavy pages, e-commerce product shots, and any context where bandwidth matters. Use WebP when encoding speed matters (e.g., generating thumbnails on the fly) or when you need broad browser support including older Safari.',
    },
    {
      q: 'Why does AVIF encoding take longer than JPG or WebP?',
      a: 'AVIF encoding is computationally heavier because it uses the AV1 video codec, which was designed for maximum compression efficiency rather than speed. At the default effort of 4, expect roughly 2–10x longer encode times than WebP for the same image. Lowering the effort slider speeds up encoding at the cost of slightly larger files. Decoding AVIF is fast — the performance hit is encode-only.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: "Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images, filenames, or metadata.",
    },
  ],

  relatedTools: ['avif-to-jpg', 'jpg-to-webp', 'png-to-avif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'avif-browser-support', 'best-webp-quality'],

  meta: {
    title: 'JPG to AVIF Converter — ConvertYard',
    description:
      'Convert JPG to AVIF in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Includes quality, effort, resize, and metadata controls.',
  },
}

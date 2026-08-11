import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-avif',
  title: 'PNG to AVIF Converter',
  subtitle: 'PNG to AVIF — same quality, up to 50% smaller file. Convert your entire library without uploading anything.',
  bestFor: 'Best for front-end developers replacing PNG assets with AVIF to cut page weight on modern browsers.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'avif', opts, onProgress, onResult),
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 70,
      hint: '70 gives excellent results for photos. Use lossless mode for logos and UI assets.',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Pixel-perfect quality — larger files, ignores the quality slider. Best for screenshots, logos, and UI.',
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
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and color profile metadata — slightly smaller files',
    },
  ],

  faq: [
    {
      q: 'How much smaller will my AVIF files be compared to PNG?',
      a: "AVIF is dramatically smaller than PNG for photographic content — typically 70–85% smaller. For non-photographic content like logos, screenshots, and UI assets, the difference is less pronounced; lossless AVIF is usually 20–40% smaller than PNG. The exact savings depend on image complexity. ConvertYard shows you per-file byte savings so you can verify before using the converted files.",
    },
    {
      q: 'Should I use lossy or lossless mode for PNG to AVIF?',
      a: "Use lossless mode for images that require pixel-perfect accuracy: logos, icons, screenshots, UI mockups, text-heavy images, and any image you'll edit again. Use lossy mode (the default) for photographs, illustrations with gradients, and images destined for display — the quality difference at 70 is invisible and file sizes are much smaller.",
    },
    {
      q: 'Does AVIF support transparency like PNG?',
      a: 'Yes. AVIF fully supports an alpha channel (transparency), just like PNG. Transparent regions in your PNG will be preserved in the output AVIF. Browser support for AVIF transparency is universal in all AVIF-supporting browsers.',
    },
    {
      q: 'What browsers support AVIF?',
      a: 'Chrome (v85+), Firefox (v93+), Edge (v121+), and Safari (v16.4+). That covers over 93% of global web traffic. For maximum compatibility, use a <picture> element with AVIF as the preferred source and PNG as the fallback.',
    },
    {
      q: 'Why does AVIF encoding take longer than WebP or PNG?',
      a: "AVIF uses the AV1 codec under the hood, which prioritizes maximum compression over speed. Encoding a large PNG to AVIF at effort 4 takes 2–10x longer than WebP. Reduce the effort slider to 0–2 if speed matters. Decoding is fast — the slowness is encode-only and doesn't affect load times for your users.",
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: "Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images.",
    },
  ],

  relatedTools: ['avif-to-png', 'png-to-webp', 'jpg-to-avif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'avif-browser-support', 'lossless-vs-lossy'],

  meta: {
    title: 'PNG to AVIF Converter — ConvertYard',
    description:
      'Convert PNG to AVIF in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Supports lossless mode, quality control, and resize.',
  },
}

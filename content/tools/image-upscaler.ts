import type { ToolConfig, ConversionResult } from '@/lib/types'
import { upscaleBatch, type UpscaleScale, type UpscaleOutputFormat, type ImageMode } from '@/lib/converters/image-upscaler'

export const config: ToolConfig = {
  slug: 'image-upscaler',
  title: 'AI Image Upscaler',
  subtitle:
    'Enlarge photos 2×–8× with Real-ESRGAN in your browser. Graphics use Lanczos resize, not a neural net. No upload, no account.',
  bestFor:
    'Best for enlarging product photos and web images at 2×–4×. Not a replacement for desktop print tools.',
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'],
  outputExt: '.jpg',

  convertFn: async (files, options, onProgress): Promise<ConversionResult[]> => {
    const scale = ((options.scale as string) ?? '4x') as UpscaleScale
    const outputFormat = ((options.outputFormat as string) ?? 'match') as UpscaleOutputFormat
    const imageMode = ((options.imageMode as string) ?? 'auto') as ImageMode
    const results = await upscaleBatch(
      files,
      { scale, outputFormat, imageMode },
      () => {},
      (fileIndex: number, pct: number) => onProgress?.(fileIndex, pct)
    )
    return results
  },
  enablePresets: true,

  warningFn: (files) => {
    if (files.length > 20) {
      return `Upscaling ${files.length} images one at a time will take a while. Large photos at 4× or 8× may run out of browser memory.`
    }
    return null
  },

  limitationNote: {
    summary: 'Sharper than a normal resize — not a desktop upscaler',
    body: 'On GPU browsers, photos at 4× run Real-ESRGAN general v3 (~5 MB). Other browsers use Swin2SR, with a separate compressed-JPEG model. 2× is always Swin2SR. It does not denoise, recover faces, or match desktop tools such as Topaz Photo AI. Graphic / logo mode is Lanczos resize plus light sharpen — no neural net.',
  },

  options: [
    {
      type: 'radio',
      name: 'scale',
      label: 'Upscale factor',
      default: '4x',
      choices: [
        { value: '2x', label: '2× (fastest)' },
        { value: '3x', label: '3×' },
        { value: '4x', label: '4× (recommended)' },
        { value: '8x', label: '8× (slowest)' },
      ],
      hint: '4× is the usual pick. 8× is two model passes and uses much more memory.',
    },
    {
      type: 'radio',
      name: 'imageMode',
      label: 'Image type',
      default: 'auto',
      choices: [
        { value: 'auto', label: 'Auto-detect' },
        { value: 'photo', label: 'Photo (AI)' },
        { value: 'graphic', label: 'Graphic / logo (Lanczos)' },
      ],
      conditionalHints: {
        auto: 'Detects photo vs graphic from colour count and flat areas. Override if it guesses wrong.',
        photo: '4× uses Real-ESRGAN v3 on GPU browsers, Swin2SR otherwise. 2× always uses Swin2SR. Compressed JPEGs get a different 2× model when auto-detected.',
        graphic: 'Lanczos resize plus light sharpen. No neural net. Use for logos, UI, and flat-colour graphics.',
      },
    },
    {
      type: 'dropdown',
      name: 'outputFormat',
      label: 'Output format',
      default: 'match',
      choices: [
        { value: 'match', label: 'Match input format' },
        { value: 'image/jpeg', label: 'JPEG' },
        { value: 'image/png', label: 'PNG' },
        { value: 'image/webp', label: 'WebP' },
      ],
    },
  ],

  faq: [
    {
      q: 'Are my images uploaded to run the upscaler?',
      a: 'No. Photos are upscaled in your browser. Nothing is sent to a server. GPU browsers download Real-ESRGAN v3 (~5 MB) for 4×; other browsers use Swin2SR (~20 MB). Models cache after the first load.',
    },
    {
      q: 'What does Photo vs Graphic actually do?',
      a: 'Photo runs an AI super-resolution model: Real-ESRGAN v3 at 4× (and as the first hop of 3×/8×), Swin2SR at 2×. Graphic / logo skips the model and uses Lanczos resize plus a light unsharp mask — the right choice for logos, UI, and flat-colour graphics, and not an illustration AI. Auto-detect picks from colour variety and flat patches; override it if the guess is wrong.',
    },
    {
      q: 'Is this better than a standard resize?',
      a: 'On photographs, usually yes at 2×–4×. A normal resize interpolates pixels and looks soft. Real-ESRGAN reconstructs edges and some texture. It is not as sharp or detailed as desktop tools that use larger models, and it does not recover faces or strip noise first. On graphics, this tool already is a standard (Lanczos) resize.',
    },
    {
      q: 'How does this compare to Topaz or other desktop upscalers?',
      a: 'It does not match them. Topaz Photo AI and Gigapixel run several full-precision models on your GPU — denoise, sharpen, face recovery, then upscale. This page runs Real-ESRGAN v3 (or Swin2SR at 2×) in the tab. Use it for private, free, batch enlargements of everyday photos. Use a desktop tool for portraits, noisy files, old scans, and print-critical work.',
    },
    {
      q: 'Which scale should I pick?',
      a: '4× is the usual balance of quality and time. Use 2× for a small bump or a faster result. 3× runs the 4× model and then Lanczos-downsamples. 8× runs Real-ESRGAN 4× then Swin2SR 2× — much slower, much larger files, and more likely to hit browser memory limits.',
    },
    {
      q: 'What types of images produce poor results?',
      a: 'Portraits (no face-recovery pass), noisy or low-light photos, old scans, painted illustrations, line art, and anything under about 50 px on a side. Very large sources (above ~4000×4000 px) may fail or get pre-shrunk to fit the browser canvas limit.',
    },
    {
      q: 'What scale should I use for printing?',
      a: 'A 500×500 px image at 4× becomes 2000×2000 px — about 6×6 inches at 300 DPI. That is fine for a small print if the source is already clean. 8× makes the pixels; it does not invent Topaz-level detail. File sizes land in the tens of megabytes.',
    },
    {
      q: 'How many files can I process at once?',
      a: 'The dropzone accepts up to 1,000 files. They run one at a time. For this tool, keep batches closer to 20–50 — each photo is a heavy GPU/CPU job. If a file fails, try it alone or drop to 2×.',
    },
  ],

  relatedTools: ['background-remover', 'compress-image', 'alt-text-generator', 'jpg-to-png'],
  relatedArticles: [],

  meta: {
    title: 'AI Image Upscaler — ConvertYard',
    description:
      'Upscale photos 2×–8× with on-device Real-ESRGAN in your browser. Graphics use Lanczos, not a neural net. No upload, no account. Batch 1,000 files.',
  },
}

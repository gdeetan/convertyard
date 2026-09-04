import type { ToolConfig, ConversionResult } from '@/lib/types'
import { upscaleBatch, type UpscaleScale, type UpscaleOutputFormat, type ImageMode } from '@/lib/converters/image-upscaler'

export const config: ToolConfig = {
  slug: 'image-upscaler',
  title: 'AI Image Upscaler',
  subtitle:
    'Enlarge photos and illustrations 2×–8× in your browser. Logos can stay on Lanczos. No upload, no account.',
  // Long-form caveat is rendered as a collapsible "Important note" in the
  // page (see app/(tools)/image-upscaler/page.tsx) instead of the shared
  // bestFor line, so the warning icon draws the eye before the drop area.
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'],
  outputExt: '.jpg',

  convertFn: async (files, options, onProgress, onResult): Promise<ConversionResult[]> => {
    const scale = ((options.scale as string) ?? '4x') as UpscaleScale
    const outputFormat = ((options.outputFormat as string) ?? 'match') as UpscaleOutputFormat
    const imageMode = ((options.imageMode as string) ?? 'auto') as ImageMode
    return upscaleBatch(
      files,
      { scale, outputFormat, imageMode },
      () => {},
      (fileIndex: number, pct: number) => onProgress?.(fileIndex, pct),
      onResult
    )
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
    body: 'On GPU browsers, photos at 4× run Real-ESRGAN general v3 (~5 MB). Illustrations, badges, and line art use RealESR AnimeVideo v3 (~2.5 MB). Other browsers use Swin2SR for photos and Lanczos for illustrations. 2× photos always use Swin2SR. It does not denoise, recover faces, or match desktop tools such as Topaz Photo AI. Graphic / logo mode is Lanczos resize plus light sharpen — no neural net. A 4× result cannot exceed 8,192 px on a side. A 1,000×13,000 infographic is shrunk before upscaling — export those from the design file, or split them into shorter sections.',
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
        { value: 'illustration', label: 'Illustration (AI)' },
        { value: 'graphic', label: 'Graphic / logo (Lanczos)' },
      ],
      conditionalHints: {
        auto: 'Photos use the photo model. Icons, badges, comics, and other 2D files use Illustration. Override if it guesses wrong.',
        photo: '4× uses Real-ESRGAN v3 on GPU browsers, Swin2SR otherwise. 2× always uses Swin2SR. Compressed JPEGs get a different 2× model when auto-detected.',
        illustration: 'RealESR AnimeVideo v3 on GPU browsers — linework and flat colour. Falls back to Lanczos if WebGPU is unavailable. Can halo small type.',
        graphic: 'Lanczos resize plus light sharpen. No neural net. Use for wordmarks and UI if Illustration looks wrong.',
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
      a: 'No. Files are upscaled in your browser. Nothing is sent to a server. GPU browsers download Real-ESRGAN v3 (~5 MB) for photos and AnimeVideo v3 (~2.5 MB) for illustrations; other browsers use Swin2SR for photos and Lanczos for illustrations. Models cache after the first load.',
    },
    {
      q: 'What do Photo, Illustration, and Graphic actually do?',
      a: 'Photo runs Real-ESRGAN v3 at 4× (Swin2SR at 2×, or as a fallback). Illustration runs RealESR AnimeVideo v3 — better for line art, badges, comics, and flat colour. Graphic / logo is Lanczos plus a light unsharp, with no neural net. Auto-detect sends few-colour / flat-patch files to Illustration; pick Graphic if the model halos type or a wordmark.',
    },
    {
      q: 'Is this better than a standard resize?',
      a: 'On photographs and 2D art, usually yes at 2×–4×. A normal resize interpolates pixels and looks soft. The photo and illustration models reconstruct edges. They are not as sharp as desktop tools that use larger models, and they do not recover faces or strip noise first. Graphic / logo mode is a standard (Lanczos) resize.',
    },
    {
      q: 'How does this compare to Topaz or other desktop upscalers?',
      a: 'It does not match them. Topaz Photo AI and Gigapixel run several full-precision models on your GPU — denoise, sharpen, face recovery, then upscale. This page runs Real-ESRGAN v3 (or Swin2SR at 2×) in the tab. Use it for private, free, batch enlargements of everyday photos. Use a desktop tool for portraits, noisy files, old scans, and print-critical work.',
    },
    {
      q: 'Which scale should I pick?',
      a: '4× is the usual balance of quality and time. Use 2× for a small bump or a faster result. 3× runs the 4× model and then Lanczos-downsamples. Photo 8× runs Real-ESRGAN 4× then Swin2SR 2×. Illustration 8× runs AnimeVideo 4× then Lanczos — much slower, much larger files, and more likely to hit browser memory limits.',
    },
    {
      q: 'What types of images produce poor results?',
      a: 'Portraits (no face-recovery pass), noisy or low-light photos, old scans, and anything under about 50 px on a side. Illustration mode can halo tiny type on logos — switch to Graphic / logo if that happens. Very tall or wide sources (a 4× side over 8,192 px) are pre-shrunk to fit the browser canvas — the download can be smaller than the original.',
    },
    {
      q: 'Can I upscale a long infographic or full-page screenshot?',
      a: 'Not to a true 4× of the whole file. The browser cannot draw a bitmap larger than 8,192 px on a side, so at 4× the source must stay under about 2,048 px in its longest dimension. Taller files are shrunk first. Split the graphic into shorter sections, or export a larger raster from the original design (Canva, Figma, Illustrator).',
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
    title: 'Upscale an Image — ConvertYard',
    description:
      'Upscale photos and illustrations 2×–8× with on-device Real-ESRGAN. Runs in your browser — no upload, no account. Batch up to 1,000 files. PNG or JPG output.',
  },
}

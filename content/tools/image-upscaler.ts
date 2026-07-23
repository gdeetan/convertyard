import type { ToolConfig, ConversionResult } from '@/lib/types'
import { upscaleBatch, type UpscaleScale, type UpscaleOutputFormat, type ImageMode } from '@/lib/converters/image-upscaler'

export const config: ToolConfig = {
  slug: 'image-upscaler',
  title: 'AI Image Upscaler',
  subtitle: 'Upscale 2×–8× using AI. Runs in your browser. No account needed.',
  bestFor: 'Best for enlarging product photos, restoring old scans, or preparing web images for large-format print.',
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
        { value: '8x', label: '8× (largest)' },
      ],
    },
    {
      type: 'radio',
      name: 'imageMode',
      label: 'Image type',
      default: 'auto',
      choices: [
        { value: 'auto', label: 'Auto-detect' },
        { value: 'photo', label: 'Photo' },
        { value: 'graphic', label: 'Graphic / illustration' },
      ],
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
      a: 'No. The ESRGAN model runs entirely in your browser — no files are sent to any server. The model downloads once on first use (a few MB) and is cached locally for all future sessions.',
    },
    {
      q: 'Is AI upscaling better than a standard resize?',
      a: 'For photos with structure, yes. Standard resizing (bicubic) interpolates pixels and blurs edges. ESRGAN predicts texture and adds realistic detail — sharper edges, clearer fabric, crisper faces. The difference is most visible at 4× and above.',
    },
    {
      q: 'Which scale should I pick?',
      a: '4× is the best balance of quality and speed for most uses. Use 2× for small enlargements or faster results. Use 8× for maximum enlargement — best for printing a small web image at large format, though processing time and file size increase significantly.',
    },
    {
      q: 'What types of images produce poor results?',
      a: 'Abstract art, flat-colour illustrations, and very low-resolution inputs (under 50px on either side) tend to produce visible artifacts or over-sharpened edges at high scale ratios. ESRGAN is trained on photographic content — it works best on images with real-world texture and structure.',
    },
    {
      q: 'What scale should I use for printing?',
      a: 'A 500×500 px web image upscaled 4× becomes 2000×2000 px — suitable for a 6×6 inch print at 300 DPI. Use 8× for larger prints, but expect file sizes in the tens of megabytes.',
    },
    {
      q: 'How many files can I process at once?',
      a: 'Up to 200 files recommended. Files are processed one at a time. Very large images (above 4000×4000 px) may exhaust browser memory — if a file fails, try processing it individually.',
    },
  ],

  relatedTools: ['background-remover', 'compress-image', 'alt-text-generator', 'jpg-to-png'],
  relatedArticles: [],

  meta: {
    title: 'AI Image Upscaler — No Upload, Batch Ready — ConvertYard',
    description:
      'Upscale images 2×, 3×, 4×, or 8× with ESRGAN AI in your browser. No upload, no account. Batch up to 200 files.',
  },
}

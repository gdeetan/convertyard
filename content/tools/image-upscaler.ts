import type { ToolConfig, ConversionResult } from '@/lib/types'
import { upscaleBatch, type UpscaleScale, type UpscaleOutputFormat } from '@/lib/converters/image-upscaler'

export const config: ToolConfig = {
  slug: 'image-upscaler',
  title: 'AI Image Upscaler',
  subtitle: 'Upscale 2×–8× using AI. Runs in your browser. No account needed.',
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'],
  outputExt: '.jpg',

  convertFn: async (files, options, onProgress): Promise<ConversionResult[]> => {
    const scale = ((options.scale as string) ?? '4x') as UpscaleScale
    const outputFormat = ((options.outputFormat as string) ?? 'match') as UpscaleOutputFormat
    const results = await upscaleBatch(
      files,
      { scale, outputFormat },
      () => {},
      (fileIndex: number, pct: number) => onProgress?.(fileIndex, pct)
    )
    return results
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
        { value: '8x', label: '8× (largest)' },
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
      q: 'Is AI upscaling better than a standard resize?',
      a: 'Yes. Standard resizing (bicubic) blurs the image. AI upscaling (ESRGAN) predicts and adds realistic detail — sharper edges, clearer textures — especially on photos and product images.',
    },
    {
      q: 'Which scale should I pick?',
      a: '4× is the best balance of quality and speed for most uses. Use 2× when you only need a small enlargement or want faster processing. Use 8× for maximum enlargement — ideal for printing a small web image at large format.',
    },
    {
      q: 'How much larger will my files be?',
      a: '4× upscaling makes the image 16× more pixels, so file sizes grow significantly. A 200 KB JPEG may become 1–3 MB. PNG files grow more because they are lossless.',
    },
    {
      q: 'Does it work on photos of people?',
      a: 'Yes. ESRGAN handles faces well. It works best on front-facing, reasonably lit portraits. Very dark or blurry source images will still upscale but with less detail recovery.',
    },
    {
      q: 'What scale should I use for printing?',
      a: '4× is recommended for printing web images. A 500×500 px web image becomes 2000×2000 px — suitable for a 6×6 inch print at 300 DPI. Use 8× for even larger prints.',
    },
    {
      q: 'Does it work offline?',
      a: 'Yes, after the first model download (~2 MB, cached after first use). Subsequent uses work completely offline.',
    },
    {
      q: 'How many files can I process at once?',
      a: 'Up to 200 files recommended. Each file is processed sequentially using your device GPU via WebGL. Processing time scales with image dimensions.',
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

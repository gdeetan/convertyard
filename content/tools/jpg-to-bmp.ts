import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-bmp',
  title: 'JPG to BMP Converter',
  subtitle: 'Convert JPG to uncompressed BMP for legacy software and game pipelines.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.bmp',
  convertFn: (files, opts, onProgress) => libvipsConvert(files, 'bmp', opts, onProgress),
  options: [
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: true,
      hint: 'BMP does not carry EXIF metadata — this removes it before encoding',
    },
  ],
  faq: [
    {
      q: 'Why are BMP files so large?',
      a: "BMP is uncompressed by default — every pixel's RGB value is stored directly. A 1920×1080 24-bit BMP is about 6MB regardless of image content.",
    },
    {
      q: 'What software needs BMP input?',
      a: 'Older Windows applications, game modding tools, industrial machine vision software, and some embedded display drivers specify BMP as their required input format.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your files never leave your device.',
    },
  ],
  relatedTools: ['bmp-to-jpg', 'jpg-to-png', 'png-to-jpg'],
  relatedArticles: [],
  meta: {
    title: 'JPG to BMP Converter — ConvertYard',
    description:
      'Convert JPG to uncompressed BMP for legacy Windows software and game toolchains. Batch convert locally in your browser — no uploads.',
  },
}

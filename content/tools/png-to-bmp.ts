import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-bmp',
  title: 'PNG to BMP Converter',
  subtitle: 'Convert PNG to uncompressed BMP for legacy software and game pipelines.',
  bestFor: 'Best for developers and modders who need uncompressed BMP input for legacy Windows tools, game engines, or embedded display drivers.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.bmp',
  convertFn: (files, opts, onProgress, onResult) => libvipsConvert(files, 'bmp', opts, onProgress, onResult),

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
      q: 'Are my PNG files uploaded to convert them?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Why would I convert PNG to BMP?',
      a: 'Almost no one should — unless forced to. Specific cases: older Windows applications that only accept BMP input, game modding tools and level editors that require uncompressed textures, industrial machine vision or embedded display drivers with BMP-only APIs, and some legacy print workflows. If your software accepts PNG, use PNG.',
    },
    {
      q: 'Why are BMP files so much larger than PNG?',
      a: 'BMP is uncompressed by default — every pixel\'s RGB value is stored directly. PNG uses lossless compression that can reduce file size by 50–80%. A 1920×1080 24-bit BMP is always about 6MB regardless of image content.',
    },
    {
      q: 'Does BMP support transparency?',
      a: 'Standard 24-bit BMP does not support an alpha channel. 32-bit BMP technically can, but it is not widely supported by applications that read BMP. If your target application needs transparency, keep using PNG.',
    },
    {
      q: 'Can I convert 1,000 PNG files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server queue. Download all results as a ZIP when done.',
    },
  ],

  relatedTools: ['bmp-to-png', 'png-to-jpg', 'jpg-to-bmp', 'compress-image'],
  relatedArticles: [],

  meta: {
    title: 'PNG to BMP Converter — ConvertYard',
    description:
      'Convert PNG to uncompressed BMP for legacy Windows software and game toolchains. Batch convert locally in your browser — no uploads, no account needed.',
  },
}

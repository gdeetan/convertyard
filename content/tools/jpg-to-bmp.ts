import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-bmp',
  title: 'JPG to BMP Converter',
  subtitle: 'Convert JPG to uncompressed BMP for legacy software and game pipelines.',
  bestFor: 'Best for developers and modders who need uncompressed BMP input for legacy Windows tools or game engines.',
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
      q: 'Are my JPG files uploaded to convert them?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Why would I convert JPG to BMP?',
      a: 'Almost no one should — unless forced to. Specific cases: older Windows applications that only accept BMP input, game modding tools and level editors that require uncompressed textures, industrial machine vision or embedded display drivers with BMP-only APIs, and some legacy print workflows. If your software accepts JPG, use JPG.',
    },
    {
      q: 'Why are BMP files so large?',
      a: "BMP is uncompressed by default — every pixel's RGB value is stored directly. A 1920×1080 24-bit BMP is always about 6MB regardless of image content. There is nothing to save by choosing BMP for web or general use.",
    },
    {
      q: 'Does converting JPG to BMP improve quality?',
      a: 'No. JPG compression is lossy — quality lost when the JPG was created cannot be recovered by converting to BMP. The BMP will be a lossless copy of whatever the JPG contains, including any compression artifacts. Converting to BMP only stops further lossy re-encoding, it does not restore lost detail.',
    },
    {
      q: 'Does BMP support transparency?',
      a: 'Standard 24-bit BMP does not support an alpha channel. 32-bit BMP technically can, but it is not widely supported by applications that read BMP. If you need transparency, use PNG instead.',
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

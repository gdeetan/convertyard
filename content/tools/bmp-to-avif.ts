import { libvipsConvert } from '@/lib/converters/libvips'
import { AvifConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-avif',
  title: 'BMP to AVIF Converter',
  subtitle: 'Compress legacy BMP files into modern AVIF. Up to 98% smaller.',
  bestFor: 'Best for modernising BMP asset libraries for web delivery — game assets, screenshots, or scanned diagrams.',
  category: 'images',
  accepts: ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  acceptsExt: ['.bmp'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress, onResult) => libvipsConvert(files, 'avif', opts, onProgress, onResult),
  enablePresets: true,

  previewPanel: AvifConversionPreview,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 70,
      hint: '70 is the sweet spot for AVIF — visually identical to the source at a fraction of the BMP file size',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Encoding effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 9 = smallest file (slower). AVIF encoding is thorough — large files may take a few seconds.',
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
      hint: 'Removes any embedded metadata from the output AVIF',
    },
  ],

  faq: [
    {
      q: 'Are my BMP files uploaded to convert them?',
      a: 'No. Conversion takes place <strong>entirely in your browser using WebAssembly</strong>. Files remain on your <strong>local hard disk</strong>.',
    },
    {
      q: 'How much smaller will the AVIF be compared to the original BMP?',
      a: 'BMP is an <strong>uncompressed format</strong>, so compared with a compressed format like AVIF, the <strong>file size reduction can be significant</strong>. For example, a <strong>10MB BMP would be reduced to approximately 200-500KB</strong> as an AVIF file at <strong>quality 70</strong>. The file-size reduction for <strong>flat graphics like screenshots and diagrams</strong> would be even greater. For additional savings on existing images, try <a href="/compress-image/">Compress Image</a>.',
    },
    {
      q: 'Why does BMP exist if it is so inefficient?',
      a: 'BMP is an <strong>extremely simple image file</strong> that stores <strong>every pixel in a straightforward manner with no compression</strong>. So it is <strong>extremely fast to read and write within software</strong>, and <strong>doesn&rsquo;t require a codec license</strong>. That&rsquo;s why many <strong>old Windows applications, embedded systems, and even game engines</strong> still use it today. But for <strong>web delivery, it&rsquo;s completely senseless</strong> — convert to something lighter like <a href="/bmp-to-png/">PNG</a> instead.',
    },
    {
      q: 'Why choose AVIF over JPG for this conversion?',
      a: 'AVIF is <strong>30–50% smaller than a JPG</strong> of comparable quality, making it <strong>best for converting BMPs for use on the web</strong>. AVIF <strong>isn&rsquo;t supported by older browsers or software</strong> and can be encoded to <a href="/bmp-to-webp/">WebP</a> or JPG in such cases.',
    },
    {
      q: 'Will AVIF encoding take longer for BMP files?',
      a: 'BMP is a <strong>quick decode</strong> for you. Note, though, that <strong>AVIF encoding is slower than JPG / WebP encoding</strong>. Expect <strong>2-5x as long for encoding</strong> for the same amount of quality. Reducing the <strong>compression effort via the slider</strong> has a <strong>small impact on file size but greatly reduces the amount of time it takes to encode</strong>. If speed is the priority, try <a href="/bmp-to-webp/">BMP to WebP</a> instead.',
    },
  ],

  relatedTools: ['bmp-to-jpg', 'bmp-to-png', 'bmp-to-webp', 'jpg-to-avif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],
  meta: {
    title: 'BMP to AVIF Converter — ConvertYard',
    description:
      'Convert BMP to AVIF — up to 98% smaller files. Modernise legacy BMP from Windows apps and game pipelines. Batch convert locally, no uploads.',
  },
}

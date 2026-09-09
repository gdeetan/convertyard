import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-avif',
  title: 'JPG to AVIF Converter',
  subtitle: 'Based on my tests, AVIF images compress over 80% better than JPGs at the same quality and dimensions. Convert your library without uploading anything to a server.',
  bestFor: 'For website owners, converting JPG photos to a more efficient AVIF format can cut a big chunk of file size on image-heavy sites.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
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
      a: "AVIF (AV1 Image File Format) is a relatively new image format by the Alliance for Open Media (AOM) that delivers pictures in a much smaller file size at the same image quality as JPG and WebP. For instance, a JPG of medium size would weigh about 1 MB, while AVIF files of the same size are only around 400-600 kB. AVIF supports HDR, wide color gamut, semi-transparent areas, and animations, so it's currently the best image format for photographs on the web.",
    },
    {
      q: 'Does converting JPG to AVIF reduce quality?',
      a: 'The default AVIF quality setting is 70, which looks just as good as JPG and is much more efficient. So, in perceptual quality terms, 70-quality AVIF is roughly equivalent to 85-quality JPG. You may start to notice some degradation at very low quality settings (i.e., less than 40), but for web use and the like, AVIF at 70 quality is a great choice. (Originals get archived and edited, and then delivered to the web as AVIF.)',
    },
    {
      q: 'What browsers support AVIF?',
      a: 'AVIF is supported in Chrome since v85 (August 2020), Firefox since v93 (October 2021), Edge since v121, and in Safari since v16.4 (March 2023). Android and iOS browsers also support it. The only gap is support for older iOS/Safari versions. To serve those users, you can serve AVIF as the preferred format and WebP as a fallback using a <picture> element, for example.',
    },
    {
      q: 'When should I choose AVIF over WebP?',
      a: 'AVIF is better when file size matters and you can wait a bit for encoding. If you push the compression level, AVIF can compress 15-30% better than WebP at the same quality. So it’s particularly suitable for image-intensive websites, product images for online shops, and any situation where bandwidth is a concern. WebP is better when encoding speed is crucial, such as when generating thumbnails on the fly. It also supports older Safari versions, which AVIF doesn’t.',
    },
    {
      q: 'Why does AVIF encoding take longer than JPG or WebP?',
      a: 'AVIF uses the AV1 video codec for maximum compression efficiency. AVIF encoding is therefore much more compute-intensive than WebP encoding. At an effort of 4 (the default), AVIF encoding is approximately 2-10x slower than WebP for an equivalent image. But lowering the effort slider can reduce the AVIF encoding time at the cost of slightly larger images. AVIF decoding is fast; the main performance impact comes from encoding.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'No. The image conversion is done in your browser using WebAssembly, so nothing leaves your device. If you’re particular about data privacy and don’t want your photos potentially stolen in a data breach, Convertyard is a good option.',
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

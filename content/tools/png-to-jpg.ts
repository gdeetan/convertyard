import { libvipsConvert } from '@/lib/converters/libvips'
import { JpgConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-jpg',
  title: 'PNG to JPG Converter',
  subtitle: 'PNG to compact JPG — flatten transparency, cut file size, keep photo quality. Batch 1,000 files in your browser.',
  bestFor: 'Best for converting a large PNG file into a more manageable JPG format for screenshots, photographs, or any graphic images for printing, emailing, or publishing on the web.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'jpg', opts, onProgress, onResult),
  previewPanel: JpgConversionPreview,
  enablePresets: true,

  howItWorks: [
    { label: 'Drop your files', desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 1,000 files at once.' },
    { label: 'Choose settings', desc: 'Adjust quality, format, and other options to match your needs.' },
    { label: 'Click Convert', desc: 'Convertion happens in your browser, and nothing is uploaded. PNG files are converted to JPG locally, so you can convert client assets without worrying about these leaking in case of a data breach.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 85,
      hint: '85 gives excellent quality with significant file size reduction',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'Transparent PNG areas are filled with this color (JPG has no transparency)',
    },
    {
      type: 'toggle',
      name: 'progressive',
      label: 'Progressive JPEG',
      default: false,
      hint: 'Loads blurry-to-sharp in browsers — slightly larger file, better perceived performance',
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
      hint: 'Fixes rotation using EXIF data if present',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF, GPS, and camera data — smaller files, more privacy',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful if JPG looks softer than your PNG',
    },
  ],

  faq: [
    {
      q: 'Does converting PNG to JPG reduce quality?',
      a: 'Yes, it will reduce quality since JPG is a lossy format, and pixel data will be degraded during the conversion depending on the quality setting. If you use the default setting of 85, the difference is negligible compared to the file savings (over 85% in most cases). For most photographs for websites or email, a quality setting between 80 and 90% would be enough. You can check the visual different using the preview window build in this tool to check the difference.',
    },
    {
      q: 'What happens to transparent areas in my PNG?',
      a: 'Since JPG files don’t support transparency, any empty pixels in your PNG file are flattened and filled with a background color (white by default, but you can choose a custom background color using the color picker). If you need to retain the transparency, the WebP and AVIF formats support this and offer better image compression, but at the expense of compatibility.',
    },
    {
      q: 'Why would I convert PNG to JPG?',
      a: 'PNGs are lossless and often 3–10x larger than equivalent JPGs. For photographs and complex images without text or hard edges, JPG gives excellent visual quality at a fraction of the size. Use PNG when you need lossless quality, transparency, or sharp text/logos. Use JPG for photos you\'re sharing, uploading to social media, or embedding in web pages.',
    },
    {
      q: 'Can I convert 1,000 PNGs at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them one at a time in your browser — no uploads, no server queue. Speed depends on your device and image dimensions. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my PNG files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly — your PNGs never leave your device. ConvertYard\'s servers only deliver the tool\'s code; they never see your images.',
    },
  ],

  relatedTools: ['jpg-to-png', 'png-to-webp', 'png-to-avif', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'PNG to JPG Converter',
    description:
      'Convert a larger PNG file format into a smaller JPG without compromising image quality for uploading images to websites, sending photos for print, or emailing to users of older, legacy software.',
  },
}

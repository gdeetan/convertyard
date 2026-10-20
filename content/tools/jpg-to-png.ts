import { libvipsConvert } from '@/lib/converters/libvips'
import { PngConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-png',
  title: 'JPG to PNG Converter',
  subtitle: 'JPG to lossless PNG — no generation loss, every pixel preserved. Batch 1,000 files in your browser.',
  bestFor: 'Best for converting JPGs to an editable lossless format before compositing, masking, or further processing.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'png', opts, onProgress, onResult),
  previewPanel: PngConversionPreview,
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 85,
      hint: 'PNG is lossless — this controls internal compression, not pixel quality. Higher = smaller file, slightly slower encode.',
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
      hint: 'Removes EXIF, GPS, and camera data from the output PNG',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass after conversion',
    },
  ],

  faq: [
    {
      q: 'Are my JPG files uploaded to convert them?',
      a: 'Nope, files aren’t uploaded, and everything runs in your browser using WebAssembly.',
    },
    {
      q: 'Why convert JPG to PNG?',
      a: 'Two reasons I’ve talked about earlier: quality and transparency support. PNG files are lossless by default, so even when you save them again and again, the quality will not degrade because re-encoding doesn\'t reduce quality, and they support images with transparent backgrounds, like logos and icons.',
    },
    {
      q: 'Will converting JPG to PNG add a transparent background?',
      a: 'No, not automatically. JPG files don’t support transparency, and converting them to PNG won\'t create any, so the resulting PNG will be opaque. The only way to create transparency is to use a tool like GIMP or an online background remover. If your image has a solid background, you could use our <a href="/background-remover/">background remover tool</a> to remove the background and save it in a format that supports transparency.',
    },
    {
      q: 'Will converting JPG to PNG improve quality?',
      a: 'Unfortunately, it doesn’t, but it will stop any further lossy degradation from lost pixels when you re-save it. If your JPG file has compression artifacts (meaning degraded pixels from previous saves), the resulting PNG file will have those same artifacts, but preserved in a lossless format.',
    },
    {
      q: 'How much larger will the PNG be compared to the JPG?',
      a: 'If you’re talking about photographs, PNG files are typically three to five times larger than an equivalent JPG photograph. That’s because PNG’s lossless compression is less efficient in terms of keeping file sizes low, so it’s a trade-off that you need to consider. You could opt to convert to other formats like <a href="/jpg-to-webp/">WebP</a> or <a href="/jpg-to-avif/">AVIF</a> if image size is a top priority and you need to upload to a website. These formats support transparency, but are more efficient at encoding pixels and keeping file size down.',
    },
  ],

  relatedTools: ['image-upscaler', 'png-to-jpg', 'jpg-to-webp', 'jpg-to-avif', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'JPG to PNG Converter',
    description:
      'Convert JPG to PNG files to preserve quality, transparency support, and lossless quality. PNG files are ideal for graphic files like logos, screenshots, UI mockups, anything that requires a lot of sharp lines or text.',
  },
}

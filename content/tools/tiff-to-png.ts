import { libvipsConvert } from '@/lib/converters/libvips'
import { PngConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-png',
  title: 'TIFF to PNG Converter',
  subtitle:
    'Convert your TIFF images to lossless PNG. Preserve transparency, choose bit depth, and convert multi-page scans into single PNG images. Convert up to 1,000 TIFF files in your browser. Nothing uploads to an unknown server.',
  bestFor:
    'Best for sharing print-quality scans, printed assets, or archival images on the web, in chat, or anywhere TIFFs cannot be opened.',
  limitationNote: {
    summary: 'TIFFs do not open in most browsers or chat apps',
    body: 'TIFF is designed for print, scanning, and archival — not the web. Chrome and Safari will not open TIFF files (unlike PNG or GIF). Slack and Discord will not either. That is why we recommend saving TIFF files as PNG for anything you plan to share online.',
  },
  category: 'images',
  accepts: ['image/tiff', 'image/x-tiff'],
  acceptsExt: ['.tif', '.tiff'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'png', opts, onProgress, onResult),
  previewPanel: PngConversionPreview,
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'compressionLevel',
      label: 'Compression level',
      min: 0,
      max: 9,
      step: 1,
      default: 6,
      hint: 'PNG compression is lossless — higher levels shrink the file more but take longer. Quality is identical at all levels.',
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
      hint: 'Removes EXIF, IPTC, and XMP metadata from the output PNG',
    },
  ],

  faq: [
    {
      q: 'What is TIFF format and why convert to PNG?',
      a: 'TIFF is an <strong>uncompressed or losslessly compressed</strong> file format that is used by scanners, by cameras, and by various professional print workflows. PNG is another <strong>lossless file format</strong>, which is widely supported by browsers, by design applications, and by image editors — whereas TIFFs are usually only opened by <strong>specialized applications</strong>.',
    },
    {
      q: 'Is TIFF to PNG conversion lossless?',
      a: 'Yes. Both TIFF and PNG are <strong>lossless formats</strong>. So all pixels in your TIFF file will be <strong>exactly represented</strong> in the converted PNG files, regardless of the level of compression that you choose. The only aspect of the conversion that will affect the files produced is the level of compression, and that only affects the <strong>size of the encoded files</strong> and how long it takes to encode them.',
    },
    {
      q: 'How much smaller will my PNG files be compared to TIFF?',
      a: 'The degree of compression depends on the type of content, such as a <strong>300 DPI scanned document (25MB TIFF)</strong> which would compress down to <strong>5-10MB as PNG</strong>, whereas photographs with fine details will generally not compress as well as documents with mostly large, flat areas of color. The resulting PNG files will always be <strong>smaller than their TIFF counterparts</strong>, but larger than JPG files, which trade off pixel-perfect quality for smaller file size.',
    },
    {
      q: 'Can I convert 1,000 TIFF files at once?',
      a: 'Yes, technically, but it depends on the size of the TIFF files. If it&rsquo;s <strong>1MB or less</strong>, batch converting 1,000 files won&rsquo;t be an issue, but for <strong>large files upwards of 30MB</strong>, do batches of <strong>50</strong> so the browser doesn&rsquo;t freeze.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Your files will <strong>never leave your device</strong>, as conversion is done in the browser using <strong>WebAssembly</strong>.',
    },
  ],

  relatedTools: ['tiff-to-jpg', 'tiff-to-webp', 'png-to-jpg', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'exif-data-whats-hiding-in-your-photo'],

  meta: {
    title: 'TIFF to PNG — Keep Every Pixel — ConvertYard',
    description:
      'Convert TIFF to PNG in your browser. Lossless — every pixel preserved. Batch up to 1,000 files, no uploads, no account. Files never leave your device.',
  },
}

import { libvipsConvert } from '@/lib/converters/libvips'
import { JpgConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-jpg',
  title: 'TIFF to JPG Converter',
  subtitle: 'TIFF files can be 100× larger than JPG. Convert 1,000+ at once and cut file sizes by 90%. No upload.',
  bestFor: 'Best for scanning workflows where TIFFs need to be shared, emailed, or uploaded as JPGs.',
  category: 'images',
  accepts: ['image/tiff', 'image/x-tiff'],
  acceptsExt: ['.tif', '.tiff'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'jpg', opts, onProgress, onResult),
  previewPanel: JpgConversionPreview,
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
      hint: '85 gives excellent quality — TIFF files from scanners are often 10–100x larger than the resulting JPG',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'Used if the TIFF has transparency — fills transparent areas in the output JPG',
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
      hint: 'Removes EXIF, IPTC, and XMP metadata from the output JPG',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful for scanned documents and diagrams',
    },
  ],

  faq: [
    {
      q: 'What is TIFF format and why are the files so large?',
      a: 'TIFF (<strong>Tagged Image File Format</strong>) is an image file format used in many areas such as <strong>scanners, cameras and print</strong>. A <strong>300 DPI A4 scan</strong> will typically be around <strong>25-100MB</strong> as a TIFF file. Converting such a file to JPG with <strong>quality set to 85</strong> will result in a file <strong>10-50 times smaller</strong> with <strong>no visible loss of quality</strong> for most uses.',
    },
    {
      q: 'Does converting TIFF to JPG reduce quality?',
      a: 'JPG is a <strong>lossy format</strong>, meaning it <strong>discards pixel data</strong> when it&rsquo;s compressed. For photographs and other scanned material, though, the <strong>difference at 85% is usually invisible</strong>. For <strong>lossless, pixel-exact output</strong>, you might prefer to use the <a href="/tiff-to-png/" class="text-primary underline">TIFF to PNG</a> tool.',
    },
    {
      q: 'How much smaller will my JPG files be?',
      a: 'Files from scanners and cameras are big. Scanned pages at <strong>300 Dots Per Inch</strong> are typically around <strong>25MB in TIFF format</strong>. After conversion to JPG at <strong>quality 85</strong>, they need only around <strong>500KB to 2MB</strong>. The <strong>exact size in bytes</strong> for all files is shown in the results of ConvertYard.',
    },
    {
      q: 'Can I convert 1,000 TIFF files at once?',
      a: 'Yes. Drop all your files and ConvertYard <strong>processes them in your browser</strong> — <strong>no uploads, no server</strong>. TIFF files can be <strong>very large in memory</strong>, so <strong>1,000 high-resolution TIFFs may take several minutes</strong>. All results download as a <strong>single ZIP</strong>.',
    },
    {
      q: 'Is there a batch size limit?',
      a: 'Technically, yes, but it depends on the <strong>size of the TIFF files</strong> you want to convert. If you&rsquo;re working with <strong>large files (let&rsquo;s say over 40MB)</strong>, do <strong>batches of 10 to 20</strong>. If you have a computer with <strong>lots of memory and a fast processor</strong>, you&rsquo;ll be able to convert more files per batch.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Nope, <strong>nothing is uploaded to a server</strong>. Conversion runs <strong>entirely in your browser</strong> using <strong>WebAssembly</strong>. Your files <strong>never leave your device</strong>.',
    },
  ],

  relatedTools: ['tiff-to-png', 'tiff-to-webp', 'jpg-to-png', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'exif-data-whats-hiding-in-your-photo'],

  meta: {
    title: 'TIFF to JPG Converter — Scans & Photos — ConvertYard',
    description:
      'Convert TIFF scans and photos to JPG in your browser. Shrink large scanner files with a quality slider. Batch up to 1,000 files — nothing is uploaded.',
  },
}

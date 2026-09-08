import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-webp',
  title: 'JPG to WebP Converter',
  subtitle: 'Convert legacy JPG files to a lossless WebP format, and enjoy (up to) 90%+ savings in file size without sacrificing image quality, based on tests. Users will see the exact savings after each conversion. Nothing uploads to a server, so users can compress private photos without uploading them and risking a data breach, since everything is processed in the browser.',
  bestFor: 'Best for web developers cutting page weight by switching JPG assets to modern WebP.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'webp', opts, onProgress, onResult),
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 is the sweet spot — visually identical to JPG at a fraction of the size',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Larger files, pixel-perfect quality — ignores the quality slider',
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
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful if WebP looks softer than your JPG',
    },
    {
      type: 'slider',
      name: 'method',
      label: 'Compression effort',
      min: 0,
      max: 6,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 6 = smallest file (slower)',
    },
  ],

  faq: [
    {
      q: 'Does converting JPG to WebP reduce quality?',
      a: 'At the default quality setting of 80%, the difference is negligible to most viewers. WebP is more efficient than JPG at the same quality, especially if you turn on lossless mode. The only scenario where you’ll see a noticeable degradation is using low quality settings (50 or below), which looks bad regardless of format.',
    },
    {
      q: 'How much smaller will my WebP files be?',
      a: "Based on my tests, I'm getting over 70% savings converting JPG to WebP at 80% quality. However, results may vary depending on the content. Check the demo output below and the slider to see the JPG and WebP side by side; you'll hardly notice any change. ConvertYard shows you the exact byte savings per file in your results so you can see the difference immediately.",
    },
    {
      q: 'Does WebP work in all browsers?',
      a: 'WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari (since version 14, released September 2020). That covers over 97% of global web traffic. If you need to support Safari 13 or Internet Explorer, stick with JPG. For any modern web project, WebP is the right default.',
    },
    {
      q: "What's the difference between lossy and lossless WebP?",
      a: 'Lossy WebP (the default) discards some pixel data to shrink file size — at quality 80, the loss is negligible. Lossless WebP preserves every pixel exactly, like a PNG, but uses smarter compression than PNG and is typically 25% smaller than an equivalent PNG. Lossless files are 10–30% larger than lossy equivalents. Use lossless for logos, screenshots, UI assets, or images you plan to edit again.',
    },
    {
      q: 'Can I convert 1,000 JPGs at once?',
      a: 'Yes, you can drop all contents of a folder at once, but note that this will take longer than a smaller batch. One advantage of browser conversion is that it reduces the time it takes because it skips the file upload process. Most ‘free’ image converter sites also limit how many files they can process because of storage limits on their servers. Conversion speed depends on several factors: image size and processor speed. Typically, a 1,000-file batch conversion takes about 5 to 15 minutes. After conversion, you can download the batch as a zip file.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Nothing uploads. The file conversion is done entirely in your browser using WebAssembly. This is the same technology behind browser-based tools like Figma. The image files never leave your device. What our server does is deliver code to your browser, but all the processing happens locally, so there’s no risk of a data breach or people stealing your photos.',
    },
  ],

  relatedTools: ['png-to-webp', 'jpg-to-avif', 'webp-to-jpg', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'Convert JPG to WebP Files in Your Browser for Free, Nothing Uploads',
    description:
      'Convert JPG to WebP images with up to 90%+ file-size savings. Great for optimizing images. Batch convert up to 1,000 files; nothing uploads, so you can compress confidential photos without risk of a data breach. Includes quality, resize, and metadata controls.',
  },
}

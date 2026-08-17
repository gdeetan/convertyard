import { dngToPng } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'raw-to-png',
  title: 'RAW to PNG Converter',
  subtitle: 'Convert DNG camera RAW files to PNG. Lossless decode, runs in your browser.',
  bestFor: 'Best for photographers who need a shareable, lossless PNG from a DNG file without opening Lightroom or Photoshop.',
  category: 'images',
  accepts: ['image/x-adobe-dng', 'image/x-dcraw', 'image/x-raw'],
  acceptsExt: ['.dng'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) => dngToPng(files, opts, onProgress, onResult),

  limitationNote: {
    summary: 'DNG files only',
    body: 'This tool supports Adobe DNG (.dng) files — the open RAW standard used by Leica, Google Pixel, and cameras that export to DNG. Proprietary formats like CR2 (Canon), NEF (Nikon), ARW (Sony), and RAF (Fuji) are not supported. To convert those, first open them in Lightroom or your camera\'s software and export as DNG.',
  },

  faq: [
    {
      q: 'What is a DNG file?',
      a: 'DNG (Digital Negative) is an open RAW image format created by Adobe. Unlike proprietary RAW formats (CR2, NEF, ARW), DNG is not tied to a specific camera manufacturer. It is used natively by Leica cameras, Google Pixel phones, and any camera that offers DNG export. Lightroom and Capture One can also convert proprietary RAW files to DNG.',
    },
    {
      q: 'Is the PNG output lossless?',
      a: 'Yes. DNG stores the full sensor data from your camera. Converting to PNG produces a lossless copy of that image data — no further quality is lost in the format conversion step.',
    },
    {
      q: 'Does converting DNG to PNG lose EXIF metadata?',
      a: 'Most EXIF metadata (camera model, shutter speed, ISO, GPS, etc.) is preserved in the PNG output. Some DNG-specific RAW tags that have no PNG equivalent are dropped, but the standard photographic EXIF fields are retained.',
    },
    {
      q: 'Can I convert multiple DNG files at once?',
      a: 'Yes. Drop as many DNG files as you need. Each converts separately in your browser and results are available to download individually or as a ZIP.',
    },
    {
      q: 'Are my RAW files uploaded anywhere?',
      a: 'Never. Conversion runs entirely in your browser via WebAssembly. Your files never leave your device.',
    },
    {
      q: 'My CR2 / NEF / ARW file is not accepted — why?',
      a: 'Proprietary camera RAW formats require manufacturer-specific decoders not available in browser WebAssembly. This tool supports DNG only. To convert CR2, NEF, or ARW files, export them as DNG first using your camera software, Lightroom, or Adobe DNG Converter (free).',
    },
  ],

  relatedTools: ['png-to-jpg', 'compress-image', 'image-resizer', 'png-to-webp'],
  relatedArticles: [],

  meta: {
    title: 'DNG RAW to PNG Converter — ConvertYard',
    description:
      'Convert DNG camera RAW files to PNG in your browser. Lossless decode, EXIF preserved. Batch convert 1,000 DNG files locally — no uploads, no account needed.',
  },
}

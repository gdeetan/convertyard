import type { ViewerToolConfig } from '@/lib/types'
import { analyzeFiles } from '@/lib/converters/exif-viewer'
import { buildCsv, buildHtmlReport, buildJsonZip } from '@/lib/converters/exif-viewer-export'
import { ViewerRoot } from '@/components/exif-viewer/viewer-root'
import { UrlInput } from '@/components/exif-viewer/url-input'
import { ExifViewerExplainer } from '@/components/exif-viewer/explainer'

export const config: ViewerToolConfig = {
  mode: 'viewer',
  slug: 'exif-viewer',
  title: 'EXIF Viewer',
  subtitle: 'Local-first EXIF metadata reader. Built for batches.',
  bestFor: 'Best for checking GPS, camera info, and AI-generation markers before sharing or archiving a photo.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/tiff', 'image/x-canon-cr2', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif', '.tif', '.tiff', '.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.orf', '.rw2'],
  analyzeFn: analyzeFiles,
  renderResults: ViewerRoot,
  extraInput: UrlInput,
  explainer: ExifViewerExplainer,
  exportActions: [
    {
      id: 'json-zip', label: 'Download JSON (ZIP)',
      build: async (results) => ({ blob: await buildJsonZip(results), filename: 'exif-reports.zip' }),
    },
    {
      id: 'csv', label: 'Download CSV',
      build: async (results) => ({ blob: new Blob([buildCsv(results)], { type: 'text/csv' }), filename: 'exif-report.csv' }),
    },
    {
      id: 'html', label: 'Download HTML report',
      build: async (results) => ({ blob: new Blob([await buildHtmlReport(results)], { type: 'text/html' }), filename: 'exif-report.html' }),
    },
  ],
  faq: [
    { q: 'Does uploading a photo here leak my location?',
      a: 'No. Files never leave your browser. EXIF parsing runs entirely on your device using WebAssembly. You can verify this by opening your browser DevTools → Network tab and confirming no image data is uploaded.' },
    { q: 'Which image formats can I check EXIF on?',
      a: 'JPEG, HEIC/HEIF, TIFF, PNG, WebP, AVIF, and common RAW formats (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2). GIF and BMP do not carry EXIF metadata.' },
    { q: 'Can EXIF prove a photo is authentic or not AI-generated?',
      a: 'It can hint. C2PA Content Credentials, Stable Diffusion "parameters" chunks, and Midjourney creator tags are strong positive signals when present. But metadata can be stripped — an image without AI markers is not proof of human origin.' },
    { q: 'How do I remove EXIF metadata after checking it?',
      a: 'Use our Edit Metadata tool, which strips or replaces fields you select. Or set your camera/phone to not embed GPS in the first place — most modern phones let you disable location for the Camera app.' },
    { q: 'Why do social media sites strip EXIF but keep some tags?',
      a: 'Sites like Instagram and Twitter re-encode images to save bandwidth, which drops most EXIF. But some tags (orientation, color profile) survive because they affect how the image displays. Never rely on a site to strip sensitive tags for you.' },
    { q: 'Can I export EXIF data for a whole folder at once?',
      a: 'Yes. Drop as many images as you like — up to 1000 — and click Download CSV for a spreadsheet, or Download JSON (ZIP) for one report per file.' },
    { q: 'Can I check EXIF from an image URL / link?',
      a: 'Yes, for image hosts that allow direct downloads (imgur, wikipedia, github user-content, Unsplash). Sites like Twitter, Instagram, Reddit, and Facebook block direct browser access to their CDNs — in that case, save the image and drop the file here instead.' },
  ],
  relatedTools: ['edit-metadata', 'alt-text-generator', 'compress-image', 'image-to-text-converter', 'background-remover'],
  relatedArticles: [],
  meta: {
    title: 'EXIF Viewer — ConvertYard',
    description: 'View EXIF, IPTC, XMP, and GPS metadata from JPG, HEIC, RAW, and more — right in your browser. Batch up to 1000 files. Files never uploaded.',
  },
}

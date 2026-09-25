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
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/tiff', 'image/x-canon-cr2', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/3gpp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif', '.tif', '.tiff', '.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.orf', '.rw2', '.pdf', '.mp4', '.mov', '.m4v', '.3gp'],
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
      a: 'Nope. Files aren’t uploaded to a server, since the EXIF parsing runs locally (or in your browser) using WebAssembly. One way to verify is to load the tool page, then turn off WIFI and use this tool to check the EXIF data.' },
    { q: 'Which image formats can I check EXIF on?',
      a: 'JPEG, HEIC/HEIF, TIFF, PNG, WebP, AVIF, and common RAW formats (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2). GIF and BMP do not carry EXIF metadata.' },
    { q: 'Can EXIF prove a photo is authentic or not AI-generated?',
      a: 'Yes, it can, but it won’t be 100% accurate. C2PA Content Credentials, Stable Diffusion "parameters" chunks, and Midjourney creator tags are strong signals of an AI-generated image. One more thing - users can strip metadata, so an image without AI markers isn’t proof that a photo is of human origin.' },
    { q: 'How do I remove EXIF metadata after checking it?',
      a: 'Yes, it’s possible using the Edit Metadata tool, which strips or replaces the fields you choose. Another option is to change the settings in your camera/phone so it doesn’t embed the GPS. Newer smartphones have this feature, allowing users that disables this. ' },
    { q: 'Why do social media sites strip EXIF but keep some tags?',
      a: 'Platforms like Instagram and Twitter re-encode images to reduce file size and bandwidth, so they remove most of the EXIF data. However, some tags like orientation or color profile aren’t deleted. Regardless, if you’re uploading any photos on social media, it’s best to strip these sensitive tags for security purposes.' },
    { q: 'Can I export EXIF data for a whole folder at once?',
      a: 'Yes. Drop as many images as you like — up to 1000 — and click Download CSV for a spreadsheet, or Download JSON (ZIP) for one report per file.' },
    { q: 'Can I check EXIF from an image URL / link?',
      a: 'Yes, for certain websites that allow direct downloads (Imgur or Unsplash). However, platforms like Twitter, Reddit, Instagram, and Facebook block access to their CDNs, so you can\'t get EXIF data through links. Download the image and drop the file on this tool instead.' },
  ],
  relatedTools: ['ai-image-detector', 'edit-metadata', 'alt-text-generator', 'compress-image', 'background-remover'],
  relatedArticles: [],
  meta: {
    title: 'Free EXIF Metadata Viewer - Images, PDFs & Videos',
    description: 'Access EXIF data on your photos, PDF, or video files with this free tool and remove it before uploading to any site. Nothing uploads so your data is safe.',
  },
}

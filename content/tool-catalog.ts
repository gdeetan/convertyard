// content/tool-catalog.ts
export type ToolStatus = 'live' | 'coming-soon'

export interface CatalogTool {
  slug: string
  title: string
  description: string
  category: 'images' | 'pdf' | 'video-audio' | 'developer' | 'web-tools' | 'ai-tools'
  status: ToolStatus
  badge?: string
}

export const ALL_TOOLS: CatalogTool[] = [
  // Images — 10 live
  { slug: 'jpg-to-webp',  title: 'JPG to WebP',   description: 'Shrink JPGs without visible loss.', category: 'images', status: 'live' },
  { slug: 'heic-to-jpg',  title: 'HEIC to JPG',   description: 'Turn iPhone photos into universal JPGs.', category: 'images', status: 'live' },
  { slug: 'png-to-webp',  title: 'PNG to WebP',   description: 'Smaller PNGs for the web, lossless option.', category: 'images', status: 'live' },
  { slug: 'webp-to-jpg',  title: 'WebP to JPG',   description: 'Back to JPG for tools that need it.', category: 'images', status: 'live' },
  { slug: 'webp-to-png',  title: 'WebP to PNG',   description: 'Lossless WebP to PNG, transparency kept.', category: 'images', status: 'live' },
  { slug: 'heic-to-png',  title: 'HEIC to PNG',   description: 'iPhone HEIC photos as transparent-safe PNGs.', category: 'images', status: 'live' },
  { slug: 'jpg-to-avif',  title: 'JPG to AVIF',   description: 'Next-gen compression, up to 50% smaller.', category: 'images', status: 'live' },
  { slug: 'avif-to-jpg',  title: 'AVIF to JPG',   description: 'AVIF back to universal JPG.', category: 'images', status: 'live' },
  { slug: 'png-to-avif',  title: 'PNG to AVIF',   description: 'Best-in-class compression for PNGs.', category: 'images', status: 'live' },
  { slug: 'avif-to-png',  title: 'AVIF to PNG',   description: 'AVIF decoded to lossless PNG.', category: 'images', status: 'live' },
  // Images — coming soon
  { slug: 'background-remover', title: 'Background Remover', description: 'Remove backgrounds with AI, no account needed.', category: 'images', status: 'coming-soon', badge: 'AI' },
  { slug: 'image-compressor',   title: 'Image Compressor',   description: 'Batch compress any image format.', category: 'images', status: 'coming-soon' },
  { slug: 'image-resizer',      title: 'Image Resizer',      description: 'Resize to exact pixels or percent — batch.', category: 'images', status: 'coming-soon' },

  // PDF — 3 live, 2 coming soon
  { slug: 'merge-pdf',    title: 'Merge PDF',    description: 'Combine multiple PDFs into one.', category: 'pdf', status: 'live' },
  { slug: 'compress-pdf', title: 'Compress PDF', description: 'Shrink PDFs without destroying quality.', category: 'pdf', status: 'live' },
  { slug: 'pdf-to-jpg',   title: 'PDF to JPG',   description: 'Every page becomes a high-res JPG.', category: 'pdf', status: 'live' },
  { slug: 'split-pdf',    title: 'Split PDF',    description: 'Extract pages or split at page breaks.', category: 'pdf', status: 'coming-soon' },
  { slug: 'pdf-to-word',  title: 'PDF to Word',  description: 'Editable DOCX from any PDF.', category: 'pdf', status: 'coming-soon' },

  // Video & Audio — all coming soon
  { slug: 'mp4-to-mp3',       title: 'MP4 to MP3',       description: 'Strip audio from video in seconds.', category: 'video-audio', status: 'coming-soon' },
  { slug: 'video-compressor',  title: 'Video Compressor',  description: 'Compress MP4s for upload or storage.', category: 'video-audio', status: 'coming-soon' },
  { slug: 'video-to-gif',      title: 'Video to GIF',      description: 'Turn video clips into shareable GIFs.', category: 'video-audio', status: 'coming-soon' },
  { slug: 'audio-trimmer',     title: 'Audio Trimmer',     description: 'Cut audio clips without re-encoding.', category: 'video-audio', status: 'coming-soon' },
  { slug: 'extract-audio',     title: 'Extract Audio',     description: 'Pull audio tracks from any video.', category: 'video-audio', status: 'coming-soon' },

  // Developer — all coming soon
  { slug: 'json-formatter', title: 'JSON Formatter',         description: 'Format, validate, and minify JSON.', category: 'developer', status: 'live' },
  { slug: 'base64',         title: 'Base64 Encoder/Decoder', description: 'Encode and decode Base64 strings.', category: 'developer', status: 'live' },
  { slug: 'json-to-csv',    title: 'JSON to CSV',            description: 'Flatten JSON arrays into spreadsheets.', category: 'developer', status: 'live' },
  { slug: 'diff-checker',    title: 'Diff Checker',    description: 'Visual diff for text and code.', category: 'developer', status: 'coming-soon' },
  { slug: 'jwt-decoder',     title: 'JWT Decoder',     description: 'Decode and inspect JWT tokens.', category: 'developer', status: 'coming-soon' },
  { slug: 'regex-tester',    title: 'Regex Tester',    description: 'Test regex patterns with live matches.', category: 'developer', status: 'coming-soon' },

  // Web Tools — all coming soon
  { slug: 'favicon-generator',    title: 'Favicon Generator',    description: 'Generate all favicon sizes from one image.', category: 'web-tools', status: 'coming-soon' },
  { slug: 'og-image-generator',   title: 'OG Image Generator',   description: 'Design Open Graph images for social sharing.', category: 'web-tools', status: 'coming-soon' },
  { slug: 'qr-code-generator',    title: 'QR Code Generator',    description: 'Generate QR codes for any URL.', category: 'web-tools', status: 'coming-soon' },
  { slug: 'color-picker',         title: 'Color Picker',         description: 'Pick colors and export in any format.', category: 'web-tools', status: 'coming-soon' },
  { slug: 'gradient-generator',   title: 'Gradient Generator',   description: 'Build CSS gradients visually.', category: 'web-tools', status: 'coming-soon' },

  // AI Tools — all coming soon
  { slug: 'alt-text-generator',  title: 'Alt Text Generator',  description: 'Generate descriptive alt text for any image.', category: 'ai-tools', status: 'coming-soon', badge: 'AI' },
  { slug: 'image-upscaler',      title: 'Image Upscaler',      description: 'Upscale images 2×–4× with AI.', category: 'ai-tools', status: 'coming-soon', badge: 'AI' },
  { slug: 'transcription',       title: 'Transcription',       description: 'Transcribe audio and video in your browser.', category: 'ai-tools', status: 'coming-soon', badge: 'AI' },
  { slug: 'image-description',   title: 'Image Description',   description: 'Generate captions for images with AI.', category: 'ai-tools', status: 'coming-soon', badge: 'AI' },
]

export const toolsByCategory = (category: CatalogTool['category']): CatalogTool[] =>
  ALL_TOOLS.filter((t) => t.category === category)

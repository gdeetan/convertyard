// content/category-meta.ts
import type { FAQItem } from '@/lib/types'

export interface CategoryMeta {
  slug: string
  title: string
  subtitle: string
  description: string
  seoTitle: string
  seoDescription: string
  faq: FAQItem[]
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  images: {
    slug: 'images',
    title: 'Image Converters',
    subtitle: 'Local-first image conversion. Built for batches.',
    description: 'Convert between JPG, WebP, AVIF, PNG, HEIC, and more — entirely in your browser. Drop 1 file or 1,000. Nothing leaves your device.',
    seoTitle: 'Image Converters — ConvertYard',
    seoDescription: 'Batch convert images between JPG, WebP, AVIF, PNG, and HEIC in your browser. Up to 1,000 files at once — no uploads, no watermarks.',
    faq: [
      { q: 'Do my images get uploaded to a server?', a: 'No. All conversion happens in your browser using WebAssembly. Your files never leave your device.' },
      { q: 'How many images can I convert at once?', a: 'Up to 1,000 files per batch. Each file is processed in parallel where your device supports it.' },
      { q: 'Which image formats are supported?', a: 'JPG, PNG, WebP, AVIF, and HEIC are fully supported. GIF and TIFF support is coming soon.' },
      { q: 'Are the converted files watermarked?', a: 'Never. ConvertYard does not add watermarks. What you convert is what you get.' },
      { q: 'Does ConvertYard work offline?', a: 'Once the tool has loaded in your browser, yes — all conversion runs locally so no internet connection is needed.' },
    ],
  },
  pdf: {
    slug: 'pdf',
    title: 'PDF Tools',
    subtitle: 'Local-first PDF processing. Built for batches.',
    description: 'Merge, compress, split, and convert PDFs — all in your browser. No account, no upload, no size limit.',
    seoTitle: 'PDF Tools — ConvertYard',
    seoDescription: 'Merge, compress, split, and convert PDFs in your browser. Batch processing, no uploads, no watermarks.',
    faq: [
      { q: 'Are my PDFs uploaded anywhere?', a: 'No. All PDF processing happens locally in your browser using WebAssembly. Nothing is transmitted to a server.' },
      { q: 'Is there a file size limit?', a: 'There is no server-side limit because files never leave your browser. Large PDFs may take longer depending on your device.' },
      { q: 'Can I merge more than two PDFs?', a: 'Yes. Drop as many PDFs as you need — Merge PDF handles unlimited files in a single batch.' },
      { q: 'What PDF features are coming?', a: 'Compress PDF, Split PDF, PDF to JPG, and PDF to Word are all in development and coming soon.' },
    ],
  },
  'video-audio': {
    slug: 'video-audio',
    title: 'Video & Audio Tools',
    subtitle: 'Local-first media conversion. Built for batches.',
    description: 'Convert, compress, and extract audio from video — entirely in your browser using ffmpeg.wasm. No upload. No account.',
    seoTitle: 'Video & Audio Tools — ConvertYard',
    seoDescription: 'Convert MP4 to MP3, compress video, extract audio tracks, and more — in your browser. No uploads, no account needed.',
    faq: [
      { q: 'How does video conversion work in the browser?', a: 'ConvertYard uses ffmpeg.wasm — a WebAssembly build of ffmpeg that runs fully in your browser. No server processes your files.' },
      { q: 'How long does video conversion take?', a: 'It depends on file size and your device. A 100MB MP4 typically takes 30–90 seconds on a modern laptop.' },
      { q: 'Which video formats will be supported?', a: 'MP4, WebM, MOV, and AVI for input. MP3, WAV, GIF, and MP4 (re-encoded) for output.' },
      { q: 'Is there a video file size limit?', a: 'No server-side limit. Your browser allocates memory for processing — very large files (>2GB) may require a desktop browser.' },
    ],
  },
  developer: {
    slug: 'developer',
    title: 'Developer Tools',
    subtitle: 'Local-first utilities for developers. No account needed.',
    description: 'Format JSON, encode Base64, decode JWTs, test regex patterns, and more — all client-side. No data leaves your browser.',
    seoTitle: 'Developer Tools — ConvertYard',
    seoDescription: 'JSON formatter, Base64 encoder, JWT decoder, regex tester, and more developer utilities — all run locally in your browser.',
    faq: [
      { q: 'Are these tools safe for sensitive data?', a: 'Yes. All tools run locally in your browser. No data is transmitted to any server, making them safe for API keys, tokens, and private JSON.' },
      { q: 'What developer tools are coming?', a: 'JSON Formatter, Base64 Encoder, JSON to CSV, Diff Checker, JWT Decoder, and Regex Tester are all in development.' },
      { q: 'Do I need to install anything?', a: 'No. All tools run directly in your browser. There is nothing to install or configure.' },
    ],
  },
  'web-tools': {
    slug: 'web-tools',
    title: 'Web Tools',
    subtitle: 'Local-first tools for web projects. Built for speed.',
    description: 'Generate favicons, OG images, QR codes, color palettes, and CSS gradients — all without uploading a single file.',
    seoTitle: 'Web Tools — ConvertYard',
    seoDescription: 'Generate favicons, OG images, QR codes, and CSS gradients in your browser. No uploads, no account, no watermarks.',
    faq: [
      { q: 'What formats does the favicon generator export?', a: 'ICO, PNG (16×16 through 512×512), Apple touch icon, and a web manifest JSON — everything you need in one ZIP.' },
      { q: 'Can the OG image generator use custom fonts?', a: 'Yes — the tool includes a set of web-safe fonts and Google Fonts. Everything renders client-side.' },
      { q: 'Are generated QR codes royalty-free?', a: 'Yes. QR codes generated by ConvertYard are yours to use for any purpose, commercially or otherwise.' },
    ],
  },
  'ai-tools': {
    slug: 'ai-tools',
    title: 'AI Tools',
    subtitle: 'On-device AI tools. Private by design.',
    description: 'Remove backgrounds, generate alt text, upscale images, and transcribe audio — all using on-device AI via transformers.js. No API keys. No data sent out.',
    seoTitle: 'AI Tools — ConvertYard',
    seoDescription: 'AI background remover, alt text generator, image upscaler, and transcription — all running locally in your browser with transformers.js.',
    faq: [
      { q: 'Which AI model powers these tools?', a: 'ConvertYard uses models from Hugging Face via transformers.js. The model runs entirely in your browser using WebAssembly.' },
      { q: 'Do I need an API key or account?', a: 'No. The models run locally. There is no API call, no key, and no account required.' },
      { q: 'How large are the AI models?', a: 'Models are lazy-loaded on first use and range from 40MB to 200MB depending on the task. They are cached by your browser after the first load.' },
      { q: 'How accurate is the background remover?', a: 'It works well for portraits and products with clear foregrounds. Complex scenes with similar foreground/background colors may need manual cleanup.' },
    ],
  },
}

import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'photo-to-text',
  title: 'Photo to Text Converter',
  subtitle: 'Extract text from phone photos of documents. Batch-ready.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'Works best on clear, well-lit photos',
    body: 'Severely blurred or very dark photos will produce low-accuracy results. For best results, hold the camera steady and ensure even lighting across the document.',
  },

  options: [
    {
      type: 'radio',
      name: 'recognitionEngine',
      label: 'Recognition engine',
      choices: [
        { value: 'standard', label: 'Standard — all languages, no download' },
        { value: 'ai-enhanced', label: 'AI-Enhanced — English only, ~262MB (may be cached)' },
      ],
      default: 'standard',
      conditionalHints: {
        standard: 'Tesseract OCR with image preprocessing. Works with all languages. Best for clean, printed text.',
        'ai-enhanced': 'Florence-2 + TrOCR: processes the full page at once without line segmentation, then falls back to TrOCR for lines Florence-2 misses. Downloads ~262MB on first use — shared with the Image Description tool so may already be cached. English only.',
      },
    },
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language in the photo. Standard engine only — AI-Enhanced uses English.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'hin', label: 'Hindi' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'chi_tra', label: 'Chinese (Traditional)' },
        { value: 'ara', label: 'Arabic' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
        { value: 'rus', label: 'Russian' },
        { value: 'ita', label: 'Italian' },
        { value: 'nld', label: 'Dutch' },
      ],
      default: 'eng',
    },
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output format',
      choices: [
        { value: 'text', label: 'Plain text (.txt)' },
        { value: 'markdown', label: 'Markdown (.md)' },
        { value: 'combined', label: 'Combined single file' },
      ],
      default: 'text',
      conditionalHints: {
        text: 'One .txt file per photo.',
        markdown: 'One .md file per photo with the filename as heading.',
        combined: 'All photos merged into one .txt file.',
      },
    },
    {
      type: 'toggle' as const,
      name: 'autoCorrect',
      label: 'Fix common OCR errors',
      hint: 'English only. Fixes classic OCR mistakes (rn→m, O→0, etc.) using a dictionary. Only touches low-confidence words — everything is revertible in the review panel.',
      default: true,
      dependsOn: { name: 'language', value: 'eng' },
    },
  ],

  faq: [
    {
      q: 'My photo is blurry — will it still work?',
      a: 'Mild blur is handled reasonably well. Severe blur where text is unreadable to the human eye will produce poor results. Retake the photo if possible.',
    },
    {
      q: 'Does it handle HEIC photos from iPhone?',
      a: 'Yes. HEIC and HEIF files from iPhone are decoded automatically before OCR runs — you don\'t need to convert them first.',
    },
    {
      q: 'Can it read text from a photo of a book?',
      a: 'Yes. Books typically extract cleanly. Curved pages near the spine can cause some character errors — photograph the page as flat as possible for best results.',
    },
    {
      q: 'What does "Fix common OCR errors" do?',
      a: 'After OCR finishes, a dictionary pass checks each low-confidence word using known OCR confusion pairs (rn→m, O→0, l→1, etc.). Only alphabetic, low-confidence words can be corrected — tokens with digits, prices, or IDs are never touched. English only. Every change appears in the review panel where you can revert it.',
    },
    {
      q: 'Can I edit the text before downloading?',
      a: 'Yes. After conversion a review panel shows the source image alongside the extracted text. Uncertain words are underlined in amber; auto-corrected words have a blue dotted underline. Tap any blue word to revert it, or edit the text directly, then click "Apply changes".',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your photos never leave your device.',
    },
  ],

  relatedTools: ['screenshot-to-text', 'jpg-to-text', 'handwriting-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Photo to Text Converter — ConvertYard',
    description: 'Extract text from phone photos of documents, menus, and books. HEIC supported. Batch convert locally — no uploads, no account.',
  },
}

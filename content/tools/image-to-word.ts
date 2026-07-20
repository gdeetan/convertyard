import { convertImageToWord } from '@/lib/converters/image-to-word'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-to-word',
  title: 'Image to Word Converter',
  subtitle: 'Local-first OCR. Built for batches.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif'],
  outputExt: '.docx',
  convertFn: convertImageToWord,

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the image.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'ita', label: 'Italian' },
        { value: 'por', label: 'Portuguese' },
        { value: 'nld', label: 'Dutch' },
        { value: 'rus', label: 'Russian' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
        { value: 'ara', label: 'Arabic' },
      ],
      default: 'eng',
    },
    {
      type: 'radio',
      name: 'ocrMode',
      label: 'OCR mode',
      choices: [
        { value: 'auto', label: 'Auto' },
        { value: 'document', label: 'Document' },
        { value: 'singleColumn', label: 'Single column' },
        { value: 'sparse', label: 'Sparse text' },
      ],
      default: 'auto',
      conditionalHints: {
        auto: 'Best for most images — lets Tesseract decide the layout.',
        document: 'Fully automatic page segmentation. Best for complete document pages.',
        singleColumn: 'Treats the image as a single column of text.',
        sparse: 'Finds scattered text without assuming a fixed layout.',
      },
    },
    {
      type: 'dropdown',
      name: 'fontFamily',
      label: 'Font',
      hint: 'Font used in the output Word document.',
      choices: [
        { value: 'Calibri', label: 'Calibri' },
        { value: 'Arial', label: 'Arial' },
        { value: 'Times New Roman', label: 'Times New Roman' },
        { value: 'Courier New', label: 'Courier New' },
      ],
      default: 'Calibri',
    },
    {
      type: 'number',
      name: 'fontSize',
      label: 'Font size (pt)',
      hint: 'Point size in the output document.',
      min: 8,
      max: 24,
      step: 1,
      default: 11,
    },
  ],

  faq: [
    {
      q: 'Does this tool upload my images anywhere?',
      a: 'No. OCR runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'What image formats does it accept?',
      a: 'JPG, PNG, WebP, BMP, and TIFF. Drop any mix of these in a single batch.',
    },
    {
      q: 'How accurate is the text extraction?',
      a: 'Accuracy depends on image quality. Clear, high-contrast printed text typically achieves 95%+ accuracy. Low-resolution scans, handwriting, or decorative fonts will be less accurate.',
    },
    {
      q: 'Can I convert multiple images at once?',
      a: 'Yes. Drop up to 1000 images and each one is converted to its own DOCX file, then downloaded as a ZIP.',
    },
    {
      q: 'Does it work offline?',
      a: 'After the OCR engine loads on your first visit, the tool works with no internet connection.',
    },
    {
      q: 'Why does the Word file look different from my original image?',
      a: 'This tool extracts text only — it does not replicate the original layout, fonts, or images. The output is plain reflowed text in a Word document.',
    },
  ],

  relatedTools: ['jpg-to-text', 'png-to-text', 'screenshot-to-text', 'ocr-pdf', 'handwriting-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Image to Word Converter — ConvertYard',
    description: 'Extract text from images and save as editable Word documents. Batch OCR up to 1000 files in your browser. No uploads, no account.',
  },
}

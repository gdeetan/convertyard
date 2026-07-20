import { pdfToWord } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-word',
  title: 'PDF to Word Converter',
  subtitle: 'Editable Word files from any PDF — OCR included for scanned documents. Runs entirely in your browser.',
  bestFor: 'Best for PDFs you need to rewrite, reformat, or copy content from into a Word document.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.docx',
  convertFn: pdfToWord,

  options: [
    {
      type: 'number' as const,
      name: 'pageFrom',
      label: 'From page',
      min: 1,
      default: 1,
    },
    {
      type: 'number' as const,
      name: 'pageTo',
      label: 'To page',
      min: 1,
      default: 9999,
      hint: 'Leave at 9999 to convert all pages',
    },
    {
      type: 'toggle' as const,
      name: 'includeImages',
      label: 'Include page images',
      default: true,
      hint: 'Embeds page screenshots for complex layouts. Turn off for faster, text-only output.',
    },
    {
      type: 'dropdown' as const,
      name: 'ocrLanguage',
      label: 'Document language (scanned PDFs)',
      hint: 'Used only when OCR is needed for scanned PDFs. Choose the primary language in the document to improve accuracy.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'hin', label: 'Hindi' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'ara', label: 'Arabic' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
      ],
      default: 'eng',
    },
  ],

  limitationNote: {
    summary: 'What to expect from the output',
    body: 'Text PDFs — documents created digitally in Word, InDesign, or similar tools — extract cleanly with paragraph structure preserved. Complex multi-column layouts and tables may reflow. Scanned PDFs — images of physical documents — are automatically processed with Tesseract OCR. OCR accuracy is high for clean scans but may miss handwriting or low-contrast text. Original formatting (fonts, colors, images) is not preserved — only text content.',
  },

  faq: [
    {
      q: 'Are my PDFs uploaded to a server during conversion?',
      a: 'Never. Text extraction and OCR both run entirely in your browser using WebAssembly. Your PDFs never leave your device.',
    },
    {
      q: 'Will the Word document look exactly like the PDF?',
      a: 'Text content and paragraph structure are preserved. Headings, bold, and italic are detected and carried over. Complex elements — multi-column layouts, custom fonts, exact image positioning — will differ because PDFs store layout as absolute coordinates, not as structured content. For documents that started in Word, the output is usually close. For designed PDFs like brochures or invoices, expect the text but not the layout.',
    },
    {
      q: 'Does this work on scanned PDFs?',
      a: 'Yes. The tool automatically detects whether your PDF contains embedded text or is a scanned image. For scanned PDFs, it runs Tesseract OCR entirely in your browser. OCR works best on clean, high-contrast scans at 150 DPI or higher. Handwritten text and low-resolution scans produce imperfect results.',
    },
    {
      q: 'Why is my formatting different in the Word file?',
      a: 'PDFs store text as absolute positions on a page — not as paragraphs or tables. The converter uses heuristics (font size, indentation, x/y position) to reconstruct structure. The simpler the original PDF, the better the output. Newsletters, resumes, and multi-column reports are hardest to preserve faithfully.',
    },
    {
      q: 'What about password-protected PDFs?',
      a: 'Password-protected PDFs cannot be opened or converted here. Remove the password first using the Unlock PDF tool, then convert.',
    },
    {
      q: 'Can I convert just specific pages?',
      a: 'Yes. Use the "From page" and "To page" fields to select a page range. Set both to the same number to convert a single page. Leave "To page" at 9999 to convert from your start page to the end.',
    },
  ],

  relatedTools: ['pdf-to-text', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: ['word-to-pdf-and-back-what-survives', 'convertyard-vs-adobe-acrobat-pro', 'compress-pdf-without-uploading-privacy-guide'],

  meta: {
    title: 'PDF to Word Converter — ConvertYard',
    description: 'Convert PDF to editable Word (DOCX) in your browser. Free OCR for scanned PDFs. No upload, no account, no file size limit. Batch convert multiple PDFs.',
  },
}

import { pdfToWord } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-word',
  title: 'PDF to Word Converter',
  subtitle: 'Convert any PDF to an editable DOCX. Built for batches.',
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
      q: 'Will the Word document look exactly like the PDF?',
      a: 'Text content and paragraph structure are preserved. Headings, bold, and italic are detected and carried over. Complex elements — multi-column layouts, custom fonts, colors, exact image positioning — will differ because PDFs store layout as absolute coordinates, not as structured content. For documents that started life in Word, the output is usually close. For designed PDFs (brochures, invoices), expect the text but not the layout.',
    },
    {
      q: 'Does this work on scanned PDFs?',
      a: 'Yes. The tool automatically detects whether your PDF contains embedded text or is a scanned image. For scanned PDFs, it runs Tesseract OCR entirely in your browser — no upload required. OCR works best on clean, high-contrast scans. Handwritten text, low-resolution scans, or heavily formatted layouts may produce imperfect results. You can select the document language to improve accuracy.',
    },
    {
      q: 'Why is my formatting different in the Word file?',
      a: 'PDFs store text as absolute positions on a page — not as "this is a paragraph" or "this is a table." The converter uses heuristics (font size, indentation, x/y position) to reconstruct structure, but those heuristics are not perfect. The simpler the original PDF, the better the output will match. Newsletters, resumes, and reports with two or more columns are hardest to preserve.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Text extraction and OCR both run entirely in your browser using WebAssembly. Your PDFs never leave your device.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'No server-side limit because there is no server. Conversion runs in your browser tab, so the practical ceiling is your device memory. Most laptops handle PDFs up to several hundred megabytes without issue. Very large files (500 MB+) may be slow depending on your hardware.',
    },
    {
      q: 'Can I convert just specific pages?',
      a: 'Yes. Use the "From page" and "To page" fields to select a page range before converting. Leave "To page" blank to convert from a start page to the end of the document.',
    },
    {
      q: 'What about password-protected PDFs?',
      a: 'Password-protected PDFs are not supported — the converter cannot open encrypted files. Remove the password in Adobe Acrobat, Preview (Mac), or a PDF password-removal tool before converting.',
    },
    {
      q: 'Is the Word file editable?',
      a: 'Yes. The output is a standard .docx file compatible with Microsoft Word 2007 and later, Google Docs, LibreOffice Writer, and any software that supports the Open XML format. All text is fully selectable and editable.',
    },
  ],

  relatedTools: ['pdf-to-text', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to Word Converter — ConvertYard',
    description: 'Convert PDF to editable Word (DOCX) in your browser. Free OCR for scanned PDFs. No upload, no account, no file size limit. Batch convert multiple PDFs.',
  },
}

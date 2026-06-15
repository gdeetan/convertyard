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
  ],

  limitationNote: {
    summary: 'What to expect from the output',
    body: 'Text PDFs — documents created digitally in Word, InDesign, or similar tools — extract cleanly with paragraph structure preserved. Complex multi-column layouts and tables may reflow. Scanned PDFs — images of physical documents — are automatically processed with Tesseract OCR. OCR accuracy is high for clean scans but may miss handwriting or low-contrast text. Original formatting (fonts, colors, images) is not preserved — only text content.',
  },

  faq: [
    {
      q: 'Does this work on scanned PDFs?',
      a: 'Yes. The tool automatically detects whether your PDF contains embedded text or is a scanned image. For scanned PDFs, it runs Tesseract OCR entirely in your browser — no upload required. OCR works best on clean, high-contrast scans. Handwritten text, low-resolution scans, or heavily formatted layouts may produce imperfect results.',
    },
    {
      q: 'How much of the original formatting is preserved?',
      a: 'Text content and paragraph structure are preserved. Headings that appear in all-caps are detected and formatted as heading styles. Tables, columns, images, colors, and custom fonts are not preserved — DOCX output is plain, structured text. For complex layout preservation, a desktop tool like Adobe Acrobat or LibreOffice is more appropriate.',
    },
    {
      q: 'Why is PDF to Word free here when Adobe charges for it?',
      a: 'ConvertYard runs everything in your browser via WebAssembly. There is no server processing cost — your device does all the work. Adobe and most competitors upload your file to their cloud, process it there, and charge for the server time. Because we never touch your file, we have no cost to pass on.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Text extraction and OCR both run entirely in your browser. Your PDFs never leave your device.',
    },
    {
      q: 'Can I convert a batch of PDFs at once?',
      a: 'Yes. Drop multiple PDFs and each produces a separate .docx file. They all download in a ZIP. Note that OCR-mode files take longer to process than text PDFs.',
    },
    {
      q: 'What is the output file format?',
      a: 'The output is a .docx file compatible with Microsoft Word 2007 and later, Google Docs, LibreOffice Writer, and any software that supports the Open XML format.',
    },
  ],

  relatedTools: ['pdf-to-text', 'pdf-to-jpg', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to Word Converter — ConvertYard',
    description: 'Convert PDF to editable Word DOCX in your browser. Free OCR for scanned PDFs. Batch convert 1,000 files — no uploads, no account, entirely local.',
  },
}

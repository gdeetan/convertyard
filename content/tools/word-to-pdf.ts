import { wordToPdf } from '@/lib/converters/office'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'word-to-pdf',
  title: 'Word to PDF Converter',
  subtitle: 'Convert DOCX to PDF with accurate formatting. No upload, no Office license required. Batch 1,000 files.',
  bestFor: 'Best for locking a Word document into a fixed layout before submitting or sharing it.',
  category: 'pdf',
  accepts: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  acceptsExt: ['.docx', '.doc'],
  outputExt: '.pdf',
  convertFn: wordToPdf,
  limitationNote: {
    summary: 'Best for text-heavy documents',
    body: "Text, headings, basic tables, and lists convert well. Highly designed layouts (custom columns, Word themes, ActiveX, macros) may shift. For pixel-perfect output, use Word's built-in Print → Save as PDF.",
  },
  options: [
    {
      type: 'radio',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'a4', label: 'A4' },
        { value: 'letter', label: 'US Letter' },
        { value: 'legal', label: 'Legal' },
      ],
      default: 'a4',
    },
    {
      type: 'radio',
      name: 'orientation',
      label: 'Orientation',
      choices: [
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
      default: 'portrait',
    },
    {
      type: 'radio',
      name: 'margins',
      label: 'Margins',
      choices: [
        { value: 'normal', label: 'Normal (1 in)' },
        { value: 'narrow', label: 'Narrow (0.5 in)' },
        { value: 'wide', label: 'Wide (1.5 in)' },
        { value: 'none', label: 'None' },
      ],
      default: 'normal',
    },
  ],
  faq: [
    {
      q: 'Are my Word documents uploaded to your servers?',
      a: 'Never. All conversion runs in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'What Word formats are supported?',
      a: '.docx files (Word 2007 and later) are fully supported. Legacy .doc files are not — open them in Word or Google Docs and re-save as .docx before converting.',
    },
    {
      q: 'Will my formatting be preserved?',
      a: 'Text, headings, paragraphs, bullet lists, numbered lists, and basic tables convert reliably. Complex layouts — custom columns, Word themes, background images, SmartArt, and macros — may not transfer accurately. For pixel-perfect output, use Word\'s built-in File → Save As → PDF instead.',
    },
    {
      q: 'What happens to images in my DOCX?',
      a: 'Inline images are included when possible. The conversion uses the mammoth.js library. Float-positioned images (images with text wrap) may not reproduce in the correct position.',
    },
    {
      q: 'What about password-protected DOCX files?',
      a: 'Password-protected DOCX files cannot be opened by the browser. Remove the password in Word first (File → Info → Protect Document → Encrypt with Password, then clear it), then convert.',
    },
    {
      q: 'Why does the page layout look different from the original?',
      a: 'The conversion reconstructs the document layout using the page size, margin, and orientation settings you choose in the tool. If your document uses custom margins or page sizes set inside the DOCX itself, those may not be carried over automatically — adjust the settings in the tool to match.',
    },
  ],
  relatedTools: ['pdf-to-word', 'excel-to-pdf', 'jpg-to-pdf', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Word to PDF Converter — ConvertYard',
    description: 'Convert Word DOCX files to PDF in your browser. Batch convert up to 1,000 files. No upload, no account. Files never leave your device.',
  },
}

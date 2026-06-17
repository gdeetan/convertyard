import { wordToPdf } from '@/lib/converters/office'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'word-to-pdf',
  title: 'Word to PDF Converter',
  subtitle: 'Convert DOCX files to PDF in your browser. No upload. Built for batches.',
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
      q: 'What Word formats are supported?',
      a: '.docx files are fully supported. Legacy .doc files (pre-2007 Word) are not — re-save as .docx in Word first.',
    },
    {
      q: 'Will my formatting be preserved?',
      a: "Text, headings, paragraphs, bullet lists, numbered lists, and basic tables convert reliably. Complex layouts — custom columns, Word themes, background images, SmartArt, and macros — may not transfer. For pixel-perfect output, use Word's Print → Save as PDF.",
    },
    {
      q: 'What happens to images in my DOCX?',
      a: 'Inline images are included when possible. The conversion uses the mammoth.js library, which supports common image types. Very complex image layouts may not reproduce exactly.',
    },
    {
      q: 'Can I convert multiple files at once?',
      a: 'Yes. Drop as many .docx files as you need. Each becomes its own .pdf. Download individually or as a ZIP.',
    },
    {
      q: 'Are my documents uploaded anywhere?',
      a: 'Never. All conversion runs in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'What about password-protected DOCX files?',
      a: 'Password-protected DOCX files cannot be opened by the browser. Remove the password in Word first, then convert.',
    },
  ],
  relatedTools: ['pdf-to-word', 'excel-to-pdf', 'jpg-to-pdf', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Word to PDF Converter — ConvertYard',
    description: 'Convert Word DOCX files to PDF in your browser. Batch convert up to 1,000 files. No upload, no account. Files never leave your device.',
  },
}

import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'redact-pdf',
  title: 'Redact PDF',
  subtitle: 'True redaction — content removed, not hidden. Free, local, no upload.',
  bestFor: 'Best for permanently removing names, SSNs, or addresses before sharing a document.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'Is my PDF uploaded to your server during redaction?',
      a: 'No. Everything runs in your browser using WebAssembly. Your file and the content you are redacting never leave your device. The verification pass also runs locally.',
    },
    {
      q: 'What is the difference between true redaction and covering text with a black box?',
      a: 'A black box drawn over PDF text is a visual overlay. The underlying text is still in the file — anyone can select, copy, or extract it with a standard PDF reader. True redaction removes the content from the file structure entirely. In this tool\'s output, the redacted data does not exist anywhere in the document.',
    },
    {
      q: 'Can anyone recover the redacted text from my output file?',
      a: 'No. Affected pages are rasterised — converted to a high-resolution image — and the black rectangle is burned directly into the pixels before embedding. The original text is never written to the output file. There is no hidden layer, no metadata, no stream to recover.',
    },
    {
      q: 'Why does text on non-redacted areas of the page become unselectable?',
      a: 'Pages with redactions are converted to images during processing. This affects the entire page — all text on that page becomes unselectable, even content that was not redacted. Pages with no redactions are copied as-is and retain selectable text.',
    },
    {
      q: 'What does "Verification passed" mean?',
      a: 'After generating the redacted PDF, the tool runs a second pass: it extracts all text from the output and searches for the strings you marked. If none are found, you see "Verification passed." If any were somehow still present, the download is blocked and an error is shown.',
    },
    {
      q: 'Can I redact by keyword or pattern across the whole document?',
      a: 'Yes. Switch to "Find & Redact" mode and type a word, phrase, or pick a preset pattern (SSN, email, phone number). The tool highlights all matches across every page. You can uncheck individual matches before applying.',
    },
  ],

  relatedTools: ['split-pdf', 'merge-pdf', 'pdf-to-text', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Redact PDF — Remove Text Permanently — ConvertYard',
    description: 'Permanently remove text from a PDF, not just hide it. Preview before you save. Runs in your browser — the file never leaves your device. Cannot be undone.',
  },
}

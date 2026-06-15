import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'redact-pdf',
  title: 'Redact PDF',
  subtitle: 'True redaction — content removed, not hidden. Free, local, no upload.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: "What's the difference between true redaction and covering with a black box?",
      a: "A black box drawn over PDF text is a visual decoration. The underlying text is still in the file — anyone can select, copy, or extract it with a standard PDF reader or command-line tool. True redaction removes the content from the file structure entirely. In our output file, the redacted data does not exist anywhere in the document.",
    },
    {
      q: 'Can anyone recover the redacted text from my output file?',
      a: 'No. We render the affected pages as images and burn the black rectangle directly into the pixels before embedding them. The original text is never written to the output file — there is no layer, no hidden stream, no metadata to recover.',
    },
    {
      q: 'What does "Verification passed" mean?',
      a: 'After generating your redacted PDF, we run a second pass: we extract all text from the output file and search for the strings you marked for redaction. If none are found, you see "Verification passed." If any were somehow still present, we would block the download and show an error.',
    },
    {
      q: 'Is my PDF uploaded to your server?',
      a: 'No. Everything runs in your browser using WebAssembly. Your file never leaves your device. The verification pass also runs locally.',
    },
    {
      q: 'Can I redact by keyword?',
      a: 'Yes. Switch to "Find & Redact" mode, type a word or phrase (or pick a preset pattern like SSN, email address, or phone number), and we will highlight all matches across every page. You can uncheck individual matches before applying.',
    },
    {
      q: 'Can I redact across multiple pages at once?',
      a: 'Yes. Keyword and pattern modes search the entire document and flag matches on every page simultaneously. Draw mode works page-by-page but you can add rectangles to any page before applying.',
    },
    {
      q: 'Does redaction affect non-redacted content on the same page?',
      a: 'Pages with redactions are rasterised — converted to a high-resolution image. Non-redacted text on those pages will no longer be selectable. Pages without any redactions are copied exactly as-is — text remains selectable and the file remains lossless.',
    },
    {
      q: 'Can I get a record of what was redacted?',
      a: 'Yes. After applying redactions, click "Download redaction log." The log lists the file name, date/time, total count, and per-redaction details (page number and pattern label if keyword mode was used). The log never contains the actual redacted text.',
    },
  ],

  relatedTools: ['split-pdf', 'merge-pdf', 'pdf-to-text', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Redact PDF — True Redaction — ConvertYard',
    description: 'Permanently redact text from PDFs in your browser. True redaction — content removed, not hidden. Free, local, no uploads. Output verified.',
  },
}

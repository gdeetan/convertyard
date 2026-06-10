import { mergePDFs } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'merge-pdf',
  title: 'Merge PDF',
  subtitle: 'Combine multiple PDFs into one file. Built for batches.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: mergePDFs,

  faq: [
    {
      q: 'What order will the pages appear in the merged PDF?',
      a: 'Pages appear in the order you arrange your files using the drag handles. Drag any file up or down before clicking Merge to set the exact page sequence you want.',
    },
    {
      q: 'Does merging reduce the quality of my PDFs?',
      a: 'No. Merging copies the original page content from each PDF without re-compressing or re-rendering anything. Text, images, and vector graphics are preserved exactly as they were in the source files.',
    },
    {
      q: 'Is there a limit on how many PDFs I can merge or how large they can be?',
      a: 'There is no hard limit built into the tool. Practical limits depend on your device memory — most modern computers handle 50+ PDFs or several hundred megabytes without issue. Very large files (500MB+) may be slow or run out of browser memory on older devices.',
    },
    {
      q: 'Does merging increase the final file size?',
      a: 'The merged file is roughly the sum of your input file sizes, sometimes a little smaller because duplicate data (like embedded fonts shared across documents) is deduplicated during the merge. You will not get significant compression just from merging — use Compress PDF after if you need a smaller file.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. The entire merge happens in your browser using WebAssembly. Your PDFs never leave your device — no upload, no account, no server involved.',
    },
    {
      q: 'Can I merge password-protected PDFs?',
      a: 'Password-protected PDFs that require a password to open are not supported — the tool will return an error for those files. PDFs with print or copy restrictions (but no open password) typically merge without issues.',
    },
  ],

  relatedTools: ['compress-pdf', 'pdf-to-jpg'],
  relatedArticles: ['merge-pdf-without-uploading'],

  meta: {
    title: 'Merge PDF — ConvertYard',
    description:
      'Merge multiple PDF files into one in your browser. Drag to reorder pages before combining. No uploads, no account — runs entirely locally.',
  },
}

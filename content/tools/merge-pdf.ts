import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'merge-pdf',
  title: 'Merge PDF',
  subtitle: 'Drag files into order, exclude individual pages, then merge — all before a single byte leaves your browser.',
  bestFor: 'Best for combining separate chapters, invoices, or reports into one PDF before sending.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  // This tool uses a custom page.tsx — convertFn is never called through ToolShell.
  convertFn: () => Promise.resolve([]),

  faq: [
    {
      q: 'Are my PDFs uploaded to your servers during the merge?',
      a: 'No. The entire merge happens in your browser using WebAssembly. Your PDFs never leave your device — no upload, no account, no server involved.',
    },
    {
      q: 'What happens to bookmarks and hyperlinks from the source files?',
      a: 'Bookmarks from each source file are merged into the combined document outline — they show up in the sidebar of your PDF reader under their original structure. Internal links that point to a page within the same source file are updated to point to the correct page in the merged output. Links pointing to external URLs are preserved.',
    },
    {
      q: 'Can I merge only specific pages from each file?',
      a: 'Yes. Expand any file in the list by clicking the chevron next to its name. A thumbnail grid of all its pages appears. Click ✕ on any page to exclude it from the merge — the thumbnail dims to show it is excluded.',
    },
    {
      q: 'Does merging reduce the quality of my PDFs?',
      a: 'No. Merging copies the original page content from each PDF without re-compressing or re-rendering anything. Text, images, and vector graphics are preserved exactly as they were in the source files.',
    },
    {
      q: 'Can I merge password-protected PDFs?',
      a: 'PDFs that require a password to open are not supported — the tool returns an error for those files. Remove the password first using Unlock PDF, then merge. PDFs with print or copy restrictions but no open password typically merge without issue.',
    },
    {
      q: 'Why is the merged PDF almost the same size as all the inputs combined?',
      a: 'The merged file is roughly the sum of input sizes, sometimes slightly smaller because shared fonts may be deduplicated. Merging does not compress content. Run the output through Compress PDF if you need a smaller file.',
    },
  ],

  relatedTools: ['extract-pages', 'split-pdf', 'compress-pdf', 'pdf-to-jpg'],
  relatedArticles: ['merge-pdf-without-uploading', 'convertyard-vs-ilovepdf', 'compress-pdf-without-uploading-privacy-guide'],

  meta: {
    title: 'Merge PDFs — ConvertYard',
    description:
      'Combine several PDFs into one file. Drag pages to reorder before merging. Runs in your browser — files never leave your device. Keep the page order intact.',
  },
}

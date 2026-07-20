import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'reorder-pdf-pages',
  title: 'Reorder PDF Pages',
  subtitle: 'Drag to rearrange, delete, or duplicate pages. Full undo/redo. Nothing leaves your browser.',
  bestFor: 'Best for fixing a scanned document where pages came out in the wrong order.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'Are my PDFs uploaded to a server during reordering?',
      a: 'Never. Reordering runs entirely in your browser using WebAssembly. Your PDF does not leave your device at any point.',
    },
    {
      q: 'Will reordering degrade the quality of my PDF?',
      a: 'No. Pages are copied exactly as-is using pdf-lib. No re-rendering, no re-encoding. Text, images, fonts, and vector graphics are preserved without any loss.',
    },
    {
      q: 'Can I delete pages while reordering?',
      a: 'Yes. Click the × button on any page thumbnail to remove it from the output. The page count updates live. Deleted pages are not included when you click Apply Changes.',
    },
    {
      q: 'Can I undo an accidental move or deletion?',
      a: 'Yes. Press Ctrl+Z (or Cmd+Z on Mac) to undo the last action — drag, delete, or duplicate. Up to 50 undo steps are supported. Use Ctrl+Y or Ctrl+Shift+Z to redo.',
    },
    {
      q: 'What happens to bookmarks and internal links when I reorder pages?',
      a: 'Bookmarks pointing to moved pages are updated to track the new position. Internal hyperlinks within the document are also updated. Links pointing to a page that was deleted become invalid.',
    },
    {
      q: 'Can I also rotate pages in this tool?',
      a: 'No — use the Rotate PDF tool for that. Keeping the tools separate prevents accidentally applying rotation when you only wanted to reorder.',
    },
  ],

  relatedTools: ['rotate-pdf', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Reorder PDF Pages — ConvertYard',
    description: 'Drag to rearrange PDF pages in your browser. Delete or duplicate pages. Undo/redo support. Preview before saving. Files never leave your device.',
  },
}

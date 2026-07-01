import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'reorder-pdf-pages',
  title: 'Reorder PDF Pages',
  subtitle: 'Drag to rearrange, delete, or duplicate pages. Full undo/redo. Nothing leaves your browser.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'Can I delete pages while reordering?',
      a: 'Yes. Click the × button on any page thumbnail to remove it from the output. Deleted pages are not included when you click Apply Changes. The page count updates live as you remove pages.',
    },
    {
      q: 'Can I duplicate a page?',
      a: 'Yes. Click the duplicate icon (⧉) on any page thumbnail to insert a copy immediately after it. The original page is unchanged — both the original and the copy appear in the output.',
    },
    {
      q: 'Can I undo a move?',
      a: 'Yes. Press Ctrl+Z (or Cmd+Z on Mac) to undo the last action — whether that was a drag, delete, or duplicate. Up to 50 undo steps are supported. Use Ctrl+Y or Ctrl+Shift+Z to redo.',
    },
    {
      q: 'Will reordering reduce the quality of my PDF?',
      a: 'No. Pages are copied exactly as-is using pdf-lib. No re-rendering, no re-encoding. Text, images, fonts, and vector graphics are preserved without any loss.',
    },
    {
      q: 'Can I also rotate pages in this tool?',
      a: 'Not here — use the Rotate PDF tool for that. Separating the operations keeps each tool focused and prevents accidental changes.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Reordering runs entirely in your browser using WebAssembly. Your PDF does not leave your device at any point.',
    },
  ],

  relatedTools: ['rotate-pdf', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Reorder PDF Pages — ConvertYard',
    description: 'Drag to rearrange PDF pages in your browser. Delete or duplicate pages. Undo/redo support. Preview before saving. Files never leave your device.',
  },
}

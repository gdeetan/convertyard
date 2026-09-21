import { markdownToPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'markdown-to-pdf',
  title: 'Markdown to PDF Converter',
  subtitle: 'Local-first Markdown conversion. Built for batches.',
  bestFor:
    'Best for developers, writers, and consultants converting READMEs, docs, notes, and client deliverables to clean PDFs.',
  category: 'pdf',
  accepts: ['text/markdown', 'text/x-markdown', 'text/plain'],
  acceptsExt: ['.md', '.markdown'],
  outputExt: '.pdf',
  convertFn: markdownToPdf,
  enablePresets: true,
  options: [
    {
      type: 'dropdown',
      name: 'theme',
      label: 'Theme',
      choices: [
        { value: 'modern', label: 'Modern (Helvetica)' },
        { value: 'classic', label: 'Classic (Times)' },
        { value: 'mono', label: 'Mono (Courier)' },
      ],
      default: 'modern',
    },
    {
      type: 'dropdown',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'A4', label: 'A4 (210 × 297mm)' },
        { value: 'Letter', label: 'Letter (8.5 × 11in)' },
      ],
      default: 'A4',
    },
    {
      type: 'slider',
      name: 'fontSize',
      label: 'Font size (pt)',
      min: 9,
      max: 16,
      step: 1,
      default: 12,
    },
    {
      type: 'toggle',
      name: 'includeCover',
      label: 'Cover page from front-matter',
      default: true,
      hint: 'Renders a title page when the .md file starts with YAML front-matter (title, author, date).',
    },
    {
      type: 'toggle',
      name: 'includeTOC',
      label: 'Auto table of contents',
      default: true,
      hint: 'Builds a TOC from your H1/H2/H3 headings.',
    },
    {
      type: 'toggle',
      name: 'combineIntoOne',
      label: 'Combine all files into a single PDF',
      default: false,
      hint: 'Great for turning a folder of notes or an Obsidian vault into one document with page breaks between files.',
    },
  ],
  howItWorks: [
    { label: 'Drop your .md files', desc: 'One file or a folder — nothing uploads.' },
    { label: 'Pick your options', desc: 'Theme, page size, cover, TOC, combine.' },
    { label: 'Download your PDF', desc: 'Per-file PDFs in a ZIP, or one combined PDF.' },
  ],
  faq: [
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Every conversion happens entirely inside your browser using WebAssembly and the pdf-lib library. Your Markdown files — and any confidential content in them — never leave your device. There is no signup, no watermark, and no per-file limit.',
    },
    {
      q: 'What Markdown features are supported?',
      a: 'Full GitHub-Flavored Markdown: headings, bold, italic, strikethrough, inline and fenced code, ordered/unordered lists, GFM tables, task lists, blockquotes, horizontal rules, and links. Fenced code blocks are syntax-highlighted in the live preview. KaTeX math and Mermaid diagrams render in the preview. Embedded images work when they are base64 data URLs.',
    },
    {
      q: 'How do I add a cover page?',
      a: 'Put YAML front-matter at the top of your .md file with title, subtitle, author, and date, then enable the "Cover page from front-matter" option. Example:\n\n---\ntitle: Q3 Roadmap\nsubtitle: Draft for review\nauthor: Alex Chen\ndate: 2026-01-15\n---',
    },
    {
      q: 'Can I combine multiple Markdown files into one PDF?',
      a: 'Yes. In the Batch tab, drop all your files and enable "Combine all files into a single PDF". Each file becomes a chapter with a page break between them. Turn on "Auto table of contents" to get a linked TOC built from every H1/H2 across the set — ideal for exporting an Obsidian vault, Notion export, or docs folder as a single document.',
    },
    {
      q: 'Does it support KaTeX math and Mermaid diagrams?',
      a: 'Yes in the live preview. Wrap inline math in single dollar signs ($E=mc^2$) and block math in double dollars ($$…$$). Mermaid diagrams go inside a ```mermaid fenced code block. PDF export renders the surrounding text; complex math and Mermaid diagrams are best captured by exporting the preview.',
    },
    {
      q: 'Can I convert 100+ files at once?',
      a: 'Yes. The Batch tab handles as many .md files as your browser can hold in memory (typically 1000+ small files). Each file becomes its own PDF, delivered in a ZIP, unless you enable the combine option.',
    },
    {
      q: 'Why does the PDF look different from GitHub?',
      a: 'GitHub uses its own web CSS. ConvertYard uses print-optimized typography based on the theme you pick (Modern/Helvetica, Classic/Times, or Mono/Courier). Headings, callouts, tables, and code blocks are styled for readability on paper, not for a browser tab.',
    },
    {
      q: 'What about GitHub-style callouts like [!NOTE] and [!WARNING]?',
      a: 'Supported. Use the same syntax as GitHub: > [!NOTE] followed by your note text. Recognized types are NOTE, TIP, WARNING, DANGER, CAUTION, and IMPORTANT. Each renders as a colored callout box in both the preview and the PDF.',
    },
  ],
  relatedTools: ['csv-to-pdf', 'epub-to-pdf', 'compress-pdf', 'pdf-to-text', 'merge-pdf'],
  relatedArticles: [
    'convert-obsidian-vault-to-pdf',
    'export-chatgpt-to-pdf',
    'markdown-resume-to-pdf',
  ],
  meta: {
    title: 'Markdown to PDF Converter - Nothing Uploads',
    description:
      'Convert Markdown (or .md) files to a more shareable PDF format with live preview. All conversions are done locally, so nothing uploads. Safe to upload confidential client files.',
  },
}

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
      a: 'GitHub-Flavored Markdown Support: full support for headings, bold, italics, strikethrough, inline code and fenced code, lists (ordered and unordered), GFM tables, task lists, blockquotes, horizontal rules and links. Code blocks are highlighted in the preview and in exported files. Math equations written in KaTeX language and Mermaid diagrams also render in the preview. Embedded images are also supported when they are base64 data URLs.',
    },
    {
      q: 'How do I add a cover page?',
      a: 'Put YAML front-matter at the top of your .md file with title, subtitle, author, and date, then turn on the "Cover page from front-matter" option. Example:<pre style="margin-top:0.75rem;padding:0.75rem 1rem;background:#f3f4f6;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.85em;line-height:1.5;white-space:pre;overflow-x:auto;">---\ntitle: Q3 Roadmap\nsubtitle: Draft for review\nauthor: Alex Chen\ndate: 2026-01-15\n---</pre>',
    },
    {
      q: 'Can I combine multiple Markdown files into one PDF?',
      a: 'Yes. In the Batch tab, you can combine all your files into one PDF. Each file becomes a chapter, and a page break appears between chapters. Also, the &ldquo;Auto table of contents&rdquo; feature will be enabled to generate a linked table of contents from all your H1 and H2 headings across all files in the set. This is especially powerful for exporting an Obsidian vault, a Notion export, or a docs folder as one big document.',
    },
    {
      q: 'Does it support KaTeX math and Mermaid diagrams?',
      a: 'Yes, in the live preview. Use single dollar signs for inline math (<code>$E=mc^2$</code>) and double dollar signs for block math (<code>$$&hellip;$$</code>). For Mermaid diagrams, use a <code>```mermaid</code> code block. PDF export of the live preview does not necessarily render complex math and Mermaid diagrams well, so they are better exported separately.',
    },
    {
      q: 'Can I convert 100+ files at once?',
      a: 'Yes. In the Batch tab, you can add as many .md files as your browser can hold in memory (for example, 1000+ small files). Each file is converted to a PDF. All files are then packed into a ZIP file unless you disabled this in settings for this conversion.',
    },
    {
      q: 'Why does the PDF look different from GitHub?',
      a: 'GitHub uses web CSS to style the repository&rsquo;s web pages. ConvertYard&rsquo;s output, however, uses print-optimized typography for the themes you select (e.g., Modern with Helvetica font, Classic with Times font, or Mono with Courier font). Output such as headings, callouts, tables, and code blocks is styled for print-quality output, not for reading in a web browser tab.',
    },
    {
      q: 'What about GitHub-style callouts like [!NOTE] and [!WARNING]?',
      a: 'Supported. The notes are created with the same syntax as GitHub (e.g., <code>&gt; [!NOTE] This is a note</code>). The following types are recognized: NOTE, TIP, WARNING, DANGER, CAUTION, and IMPORTANT. Each renders as a colored callout box in both the preview and the PDF.',
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

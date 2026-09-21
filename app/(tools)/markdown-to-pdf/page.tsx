'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/markdown-to-pdf'
import { markdownToPdf } from '@/lib/converters/pdf'
import { renderMarkdown, renderMermaidIn, stripFrontMatter } from '@/lib/converters/markdown-preview'
import { MarketingContent } from './marketing-content'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'
import './editor.css'

type EditorTheme = 'classic' | 'modern' | 'mono' | 'compact'
type Tab = 'editor' | 'batch'

const DEFAULT_MD = `---
title: My Document
author: You
date: ${new Date().toISOString().slice(0, 10)}
---

# Welcome to ConvertYard's Markdown Editor

Everything you write here stays in your browser. No uploads, no accounts, no watermark.

## What works out of the box

- **Full GFM**: tables, task lists, strikethrough
- Syntax-highlighted fenced code
- KaTeX math: $E = mc^2$ and block math:

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

- Mermaid diagrams
- Front-matter cover pages (see the top of this file)
- Auto table of contents
- GitHub-style callouts

> [!TIP]
> Drop a folder of .md files in the **Batch** tab to combine them into a single PDF.

## A table

| Tool | Cost | Uploads |
|------|------|---------|
| ConvertYard | Free | Never |
| Competitors | Free with watermark | Yes |

## A task list

- [x] Local-first processing
- [x] Batch conversion
- [ ] Your next document

## Code

\`\`\`typescript
function hello(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

## Mermaid diagram

\`\`\`mermaid
graph LR
  A[Markdown] --> B[ConvertYard]
  B --> C[PDF]
  B --> D[Preview]
\`\`\`

---

Ready when you are. Click **Download PDF** below.
`

export default function Page() {
  const [tab, setTab] = useState<Tab>('editor')
  const [source, setSource] = useState(DEFAULT_MD)
  const [html, setHtml] = useState('')
  const [rendering, setRendering] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [theme, setTheme] = useState<EditorTheme>('modern')
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4')
  const [includeCover, setIncludeCover] = useState(true)
  const [includeTOC, setIncludeTOC] = useState(true)
  const [docName, setDocName] = useState('document.md')

  const previewRef = useRef<HTMLDivElement>(null)
  const renderSeq = useRef(0)

  const words = useMemo(() => {
    const body = stripFrontMatter(source).replace(/`[^`]*`/g, ' ')
    return body.trim().length === 0 ? 0 : body.trim().split(/\s+/).length
  }, [source])

  // Debounced live preview
  useEffect(() => {
    const seq = ++renderSeq.current
    setRendering(true)
    const timer = setTimeout(async () => {
      try {
        const out = await renderMarkdown(source)
        if (seq !== renderSeq.current) return
        setHtml(out)
      } catch (err) {
        if (seq !== renderSeq.current) return
        setHtml(
          `<pre style="color:#c00">Preview error: ${
            err instanceof Error ? err.message : 'unknown'
          }</pre>`
        )
      } finally {
        if (seq === renderSeq.current) setRendering(false)
      }
    }, 180)
    return () => clearTimeout(timer)
  }, [source])

  // Post-render: run Mermaid on any diagrams in the preview
  useEffect(() => {
    if (!previewRef.current || !html) return
    let cancelled = false
    void (async () => {
      if (cancelled || !previewRef.current) return
      try {
        await renderMermaidIn(previewRef.current)
      } catch {
        /* swallow — mermaid errors already render in-place */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [html])

  const downloadPdf = useCallback(async () => {
    setDownloadingPdf(true)
    setPdfError(null)
    try {
      const file = new File([source], docName || 'document.md', { type: 'text/markdown' })
      const results = await markdownToPdf(
        [file],
        {
          pageSize,
          fontSize: 12,
          theme,
          includeTOC,
          includeCover,
        },
        undefined,
      )
      const out = results[0]
      if (!(out instanceof File)) {
        throw new Error('Conversion failed')
      }
      const url = URL.createObjectURL(out)
      const a = document.createElement('a')
      a.href = url
      a.download = out.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }, [source, docName, pageSize, theme, includeTOC, includeCover])

  const handleTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab inserts two spaces instead of moving focus
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = source.slice(0, start) + '  ' + source.slice(end)
      setSource(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">{config.subtitle}</p>
        </div>
        <div
          role="tablist"
          aria-label="Conversion mode"
          className="inline-flex self-start rounded-full border border-gray-200 bg-white p-1 shadow-sm"
        >
          <button
            role="tab"
            aria-selected={tab === 'editor'}
            onClick={() => setTab('editor')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === 'editor' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Editor
          </button>
          <button
            role="tab"
            aria-selected={tab === 'batch'}
            onClick={() => setTab('batch')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === 'batch' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Batch
          </button>
        </div>
      </div>

      {tab === 'editor' ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm">
            <input
              value={docName}
              onChange={e => setDocName(e.target.value)}
              className="w-40 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-gray-700 focus:border-gray-400 focus:bg-white focus:outline-none"
              aria-label="Filename"
            />
            <select
              value={theme}
              onChange={e => setTheme(e.target.value as EditorTheme)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-700"
              aria-label="Theme"
            >
              <option value="modern">Modern (Helvetica)</option>
              <option value="classic">Classic (Times)</option>
              <option value="mono">Mono (Courier)</option>
            </select>
            <select
              value={pageSize}
              onChange={e => setPageSize(e.target.value as 'A4' | 'Letter')}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-700"
              aria-label="Page size"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
            <label className="flex items-center gap-1.5 text-gray-700">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={e => setIncludeCover(e.target.checked)}
              />
              Cover page
            </label>
            <label className="flex items-center gap-1.5 text-gray-700">
              <input
                type="checkbox"
                checked={includeTOC}
                onChange={e => setIncludeTOC(e.target.checked)}
              />
              Table of contents
            </label>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {words} word{words === 1 ? '' : 's'}
                {rendering ? ' · rendering…' : ''}
              </span>
              <button
                onClick={downloadPdf}
                disabled={downloadingPdf || source.trim().length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingPdf ? 'Building PDF…' : 'Download PDF'}
              </button>
            </div>
          </div>

          {pdfError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
              {pdfError}
            </div>
          )}

          {/* Split pane */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-gray-100">
            <textarea
              value={source}
              onChange={e => setSource(e.target.value)}
              onKeyDown={handleTextareaKey}
              spellCheck={false}
              className="min-h-[520px] w-full resize-none rounded-bl-2xl bg-white px-4 py-4 font-mono text-sm leading-6 text-gray-800 focus:outline-none"
              placeholder="Paste or type Markdown here…"
              aria-label="Markdown source"
            />
            <div
              ref={previewRef}
              className="markdown-preview min-h-[520px] max-h-[720px] overflow-y-auto rounded-br-2xl bg-white px-6 py-5 text-gray-800"
              // Rendered HTML is generated locally by markdown-it (html: false) plus KaTeX and Mermaid; no untrusted network content.
              dangerouslySetInnerHTML={{ __html: html }}
              aria-label="Live preview"
            />
          </div>

          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            Files never leave your browser. Rendering, styling, and PDF export all run
            locally — safe for confidential client documents.
          </div>
        </div>
      ) : (
        <ToolShell config={config} />
      )}

      <MarketingContent />
    </div>
  )
}

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Copy, Check, Download, Lock, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import { convertTextToHtml } from '@/lib/dev-tools/text-to-html'
import type { TextFormat } from '@/lib/dev-tools/text-to-html'

const PLACEHOLDER = `# My Document

Write or paste **Markdown** or plain text here.

- Lists work
- As do [links](https://convertyard.com)

\`\`\`js
console.log('code blocks too')
\`\`\`
`

const FAQ = [
  {
    q: 'Does this support Markdown?',
    a: 'Yes — paste any Markdown and the tool auto-detects it. Headers, lists, links, code blocks, bold, italic, and tables are all supported via the marked parser.',
  },
  {
    q: "What's the difference between Markdown and plain text mode?",
    a: 'Markdown mode parses formatting syntax (# headers, **bold**, ``` code blocks ```) into HTML elements. Plain text mode wraps paragraphs in <p> tags and escapes special characters — no formatting is interpreted.',
  },
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. Conversion runs entirely in your browser using JavaScript. Nothing is sent to a server.',
  },
  {
    q: 'Can I use the HTML output directly on a website?',
    a: 'Yes. The output is a complete HTML document with a <!DOCTYPE html> declaration and inlined CSS — ready to open in a browser or deploy as a static page.',
  },
  {
    q: 'Why is the preview sandboxed (scripts disabled)?',
    a: 'The iframe preview disables script execution for security. The raw HTML output includes no scripts by default, but if your Markdown contained <script> tags they would be visible in the code panel and absent from the preview.',
  },
  {
    q: 'What CSS theme does the output use?',
    a: 'The GitHub Markdown CSS theme — the same stylesheet GitHub uses to render README files. It is inlined directly in the <head> so the output file is fully self-contained.',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return (
    <button
      type="button"
      onClick={copy}
      disabled={!text}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
        'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-green-500" aria-hidden />
        : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function DownloadButton({ html }: { html: string }) {
  const download = useCallback(() => {
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'output.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }, [html])
  return (
    <button
      type="button"
      onClick={download}
      disabled={!html}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
        'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      Download .html
    </button>
  )
}

export default function TextToHtmlPage() {
  const [input, setInput] = useState('')
  const [html, setHtml] = useState('')
  const [detectedFormat, setDetectedFormat] = useState<TextFormat>('markdown')
  const [formatOverride, setFormatOverride] = useState<TextFormat | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFormat = formatOverride ?? detectedFormat

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (!input.trim()) {
        setHtml('')
        return
      }
      const result = convertTextToHtml(input, formatOverride ?? undefined)
      setHtml(result.html)
      setDetectedFormat(result.format)
    }, 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [input, formatOverride])

  const toggleFormat = useCallback(() => {
    setFormatOverride(prev =>
      prev === null
        ? (detectedFormat === 'markdown' ? 'plaintext' : 'markdown')
        : prev === 'markdown' ? 'plaintext' : 'markdown'
    )
  }, [detectedFormat])

  const clear = useCallback(() => {
    setInput('')
    setHtml('')
    setFormatOverride(null)
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Developer Tools', href: '/developer' },
          { label: 'Text to HTML' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">Text to HTML Converter</h1>
        <p className="mt-2 text-base text-fg-muted">
          Convert Markdown or plain text to a full HTML document. Live preview with GitHub styling.
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Runs entirely in your browser.
        </div>
      </div>

      <div className="space-y-4">
        {/* Input */}
        <div className="rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm">
          <label htmlFor="text-input" className="mb-2 block text-sm font-medium text-fg">
            Input
          </label>
          <textarea
            id="text-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={12}
            spellCheck={false}
            className={cn(
              'w-full rounded-lg border border-border bg-bg-muted px-3 py-2',
              'font-mono text-sm text-fg placeholder:text-fg-subtle resize-y',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            )}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFormat}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              formatOverride !== null
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
            )}
            title={formatOverride ? 'Format locked — click to toggle' : 'Auto-detected — click to override'}
          >
            {activeFormat === 'markdown' ? 'Markdown' : 'Plain Text'}
            {formatOverride !== null && ' (locked)'}
          </button>

          {formatOverride !== null && (
            <button
              type="button"
              onClick={() => setFormatOverride(null)}
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-fg-muted hover:text-fg transition-colors"
              title="Reset to auto-detect"
            >
              <X className="h-3 w-3" aria-hidden />
              Auto-detect
            </button>
          )}

          <div className="ml-auto">
            <button
              type="button"
              onClick={clear}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg-muted hover:border-border-strong hover:text-fg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Split pane output */}
        {html && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left: Raw HTML */}
            <div className="rounded-2xl border border-border bg-bg-elevated shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
                <span className="text-xs font-medium text-fg">HTML output</span>
                <div className="flex items-center gap-2">
                  <CopyButton text={html} />
                  <DownloadButton html={html} />
                </div>
              </div>
              <pre className="overflow-auto p-4 text-xs font-mono text-fg leading-relaxed max-h-[520px] bg-bg-muted">
                <code>{html}</code>
              </pre>
            </div>

            {/* Right: Rendered preview */}
            <div className="rounded-2xl border border-border bg-bg-elevated shadow-sm overflow-hidden">
              <div className="border-b border-border px-4 py-2">
                <span className="text-xs font-medium text-fg">Preview</span>
              </div>
              <iframe
                srcDoc={html}
                sandbox="allow-same-origin"
                title="HTML preview"
                className="w-full"
                style={{ height: '520px', border: 'none' }}
              />
            </div>
          </div>
        )}

        {!html && (
          <div className="rounded-2xl border border-border border-dashed bg-bg-elevated p-10 text-center text-sm text-fg-subtle">
            Start typing to see the HTML output and live preview
          </div>
        )}

        <FAQAccordion items={FAQ} />
        <RelatedToolsStrip slugs={['markdown-to-pdf', 'diff-checker', 'json-formatter']} />
        <RelatedArticlesStrip slugs={[]} />
      </div>
    </div>
  )
}

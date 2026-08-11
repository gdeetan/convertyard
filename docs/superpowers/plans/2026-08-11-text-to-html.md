# Text to HTML Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `text-to-html` converter to the Developer Utilities section — paste Markdown or plain text, get a full HTML document with GitHub-style CSS, with a live split-pane preview.

**Architecture:** Custom page (like regex-tester / diff-checker) — no ToolShell. Conversion logic lives in `lib/dev-tools/text-to-html.ts`. The page component is self-contained in `app/(tools)/text-to-html/page.tsx`. No new npm dependencies — `marked` (v15) is already installed.

**Tech Stack:** React 19, Next.js App Router, TypeScript, Tailwind CSS, `marked` (already in deps), Vitest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/dev-tools/text-to-html.ts` | Create | Conversion logic: detect format, convert, build document |
| `lib/dev-tools/__tests__/text-to-html.test.ts` | Create | Unit tests for all conversion functions |
| `app/(tools)/text-to-html/page.tsx` | Create | Full page component with split-pane UI |
| `content/tool-catalog.ts` | Modify (line ~145) | Register tool in developer category |

---

## Task 1: Conversion logic

**Files:**
- Create: `lib/dev-tools/text-to-html.ts`

- [ ] **Step 1: Create the conversion module**

```typescript
// lib/dev-tools/text-to-html.ts
import { marked } from 'marked'

export type TextFormat = 'markdown' | 'plaintext'

export function detectFormat(text: string): TextFormat {
  if (/^#{1,6} |\*\*[\w]|\[.+\]\(|^```/m.test(text)) return 'markdown'
  return 'plaintext'
}

export function stripFrontmatter(text: string): string {
  return text.replace(/^---[\s\S]*?---\n?/, '')
}

export function extractTitle(text: string, format: TextFormat): string {
  if (format === 'markdown') {
    const match = text.match(/^#{1,6}\s+(.+)$/m)
    return match ? match[1].trim() : 'Document'
  }
  const firstLine = text.trim().split('\n')[0]?.trim() ?? ''
  return firstLine ? firstLine.slice(0, 60) : 'Document'
}

export function convertMarkdown(text: string): string {
  return marked.parse(stripFrontmatter(text)) as string
}

export function convertPlainText(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

export const GITHUB_CSS = `
.markdown-body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#24292f;max-width:800px;margin:0 auto;padding:32px;word-wrap:break-word}
.markdown-body h1,.markdown-body h2{border-bottom:1px solid #d1d9e0;padding-bottom:.3em}
.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:24px;margin-bottom:16px;font-weight:600;line-height:1.25}
.markdown-body h1{font-size:2em}.markdown-body h2{font-size:1.5em}.markdown-body h3{font-size:1.25em}
.markdown-body h4,.markdown-body h5,.markdown-body h6{font-size:1em}
.markdown-body p{margin-top:0;margin-bottom:16px}
.markdown-body a{color:#0969da;text-decoration:none}.markdown-body a:hover{text-decoration:underline}
.markdown-body code{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:85%;padding:.2em .4em;background:#afb8c133;border-radius:6px}
.markdown-body pre{padding:16px;overflow:auto;background:#f6f8fa;border-radius:6px;margin-bottom:16px}
.markdown-body pre code{background:transparent;padding:0;font-size:100%}
.markdown-body ul,.markdown-body ol{padding-left:2em;margin-bottom:16px}
.markdown-body li{margin-top:.25em}
.markdown-body blockquote{padding:0 1em;color:#57606a;border-left:.25em solid #d0d7de;margin:0 0 16px}
.markdown-body table{border-collapse:collapse;width:100%;margin-bottom:16px}
.markdown-body th,.markdown-body td{padding:6px 13px;border:1px solid #d0d7de}
.markdown-body th{font-weight:600;background:#f6f8fa}
.markdown-body tr:nth-child(2n){background:#f6f8fa}
.markdown-body img{max-width:100%}
.markdown-body hr{border:0;border-top:2px solid #d0d7de;margin:24px 0}
`

export function buildDocument(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${GITHUB_CSS}</style>
</head>
<body class="markdown-body">
${body}
</body>
</html>`
}

export function convertTextToHtml(
  text: string,
  format?: TextFormat,
): { html: string; format: TextFormat } {
  const resolvedFormat = format ?? detectFormat(text)
  const body =
    resolvedFormat === 'markdown'
      ? convertMarkdown(text)
      : convertPlainText(text)
  const title = extractTitle(text, resolvedFormat)
  return { html: buildDocument(body, title), format: resolvedFormat }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/dev-tools/text-to-html.ts
git commit -m "feat(dev-tools): add text-to-html conversion logic"
```

---

## Task 2: Unit tests

**Files:**
- Create: `lib/dev-tools/__tests__/text-to-html.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// lib/dev-tools/__tests__/text-to-html.test.ts
import { describe, it, expect } from 'vitest'
import {
  detectFormat,
  stripFrontmatter,
  extractTitle,
  convertMarkdown,
  convertPlainText,
  buildDocument,
  convertTextToHtml,
} from '../text-to-html'

describe('detectFormat', () => {
  it('detects markdown heading', () => {
    expect(detectFormat('# Hello')).toBe('markdown')
  })
  it('detects bold markdown', () => {
    expect(detectFormat('This is **bold** text')).toBe('markdown')
  })
  it('detects link syntax', () => {
    expect(detectFormat('[click](https://example.com)')).toBe('markdown')
  })
  it('detects code fence', () => {
    expect(detectFormat('```\ncode\n```')).toBe('markdown')
  })
  it('returns plaintext for regular text', () => {
    expect(detectFormat('Hello world\nThis is just text.')).toBe('plaintext')
  })
})

describe('stripFrontmatter', () => {
  it('strips YAML frontmatter', () => {
    const input = '---\ntitle: Test\ndate: 2026-01-01\n---\n# Hello'
    expect(stripFrontmatter(input)).toBe('# Hello')
  })
  it('returns text unchanged when no frontmatter', () => {
    expect(stripFrontmatter('# Hello\n\nContent')).toBe('# Hello\n\nContent')
  })
})

describe('extractTitle', () => {
  it('extracts first H1 from markdown', () => {
    expect(extractTitle('# My Title\n\nContent', 'markdown')).toBe('My Title')
  })
  it('extracts H2 if no H1 present', () => {
    expect(extractTitle('## Section\n\nContent', 'markdown')).toBe('Section')
  })
  it('returns Document when no heading found', () => {
    expect(extractTitle('Just content here', 'markdown')).toBe('Document')
  })
  it('uses first line for plaintext', () => {
    expect(extractTitle('Hello World\nMore text', 'plaintext')).toBe('Hello World')
  })
  it('truncates long plaintext title to 60 chars', () => {
    const longLine = 'A'.repeat(80)
    expect(extractTitle(longLine, 'plaintext').length).toBe(60)
  })
  it('returns Document for empty plaintext', () => {
    expect(extractTitle('', 'plaintext')).toBe('Document')
  })
})

describe('convertMarkdown', () => {
  it('converts h1', () => {
    expect(convertMarkdown('# Hello')).toContain('<h1>Hello</h1>')
  })
  it('converts bold', () => {
    expect(convertMarkdown('**bold**')).toContain('<strong>bold</strong>')
  })
  it('converts link', () => {
    const result = convertMarkdown('[link](https://example.com)')
    expect(result).toContain('<a href="https://example.com">link</a>')
  })
  it('strips frontmatter before converting', () => {
    const result = convertMarkdown('---\ntitle: Test\n---\n# Hello')
    expect(result).toContain('<h1>')
    expect(result).not.toContain('title: Test')
  })
})

describe('convertPlainText', () => {
  it('wraps paragraphs in p tags', () => {
    expect(convertPlainText('Hello\n\nWorld')).toBe('<p>Hello</p>\n<p>World</p>')
  })
  it('converts single newlines to br', () => {
    expect(convertPlainText('Line 1\nLine 2')).toContain('<br>')
  })
  it('escapes < and >', () => {
    const result = convertPlainText('<b>bold</b>')
    expect(result).toContain('&lt;b&gt;bold&lt;/b&gt;')
  })
  it('escapes ampersands', () => {
    expect(convertPlainText('a & b')).toContain('a &amp; b')
  })
  it('filters empty paragraphs', () => {
    const result = convertPlainText('Hello\n\n\n\nWorld')
    expect(result.split('<p>').length - 1).toBe(2)
  })
})

describe('buildDocument', () => {
  it('starts with doctype', () => {
    expect(buildDocument('<p>Hi</p>', 'Test')).toMatch(/^<!DOCTYPE html>/i)
  })
  it('includes title tag', () => {
    expect(buildDocument('<p>Hi</p>', 'My Doc')).toContain('<title>My Doc</title>')
  })
  it('wraps content in body with markdown-body class', () => {
    const result = buildDocument('<p>Hi</p>', 'Test')
    expect(result).toContain('<body class="markdown-body">')
    expect(result).toContain('<p>Hi</p>')
  })
  it('inlines github css', () => {
    expect(buildDocument('<p>Hi</p>', 'Test')).toContain('.markdown-body')
  })
})

describe('convertTextToHtml', () => {
  it('auto-detects markdown format', () => {
    const { format } = convertTextToHtml('# Hello')
    expect(format).toBe('markdown')
  })
  it('auto-detects plaintext format', () => {
    const { format } = convertTextToHtml('Just some plain text here.')
    expect(format).toBe('plaintext')
  })
  it('respects explicit format override', () => {
    const { format } = convertTextToHtml('# Hello', 'plaintext')
    expect(format).toBe('plaintext')
  })
  it('returns full HTML document', () => {
    const { html } = convertTextToHtml('# Hello\n\nContent')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<h1>')
  })
})
```

- [ ] **Step 2: Run tests — expect all to pass**

```bash
npx vitest run lib/dev-tools/__tests__/text-to-html.test.ts
```

Expected: all tests pass. If `marked.parse()` returns a Promise in your env, change to `marked.parse(text, { async: false }) as string`.

- [ ] **Step 3: Commit**

```bash
git add lib/dev-tools/__tests__/text-to-html.test.ts
git commit -m "test(dev-tools): add text-to-html unit tests"
```

---

## Task 3: Page component

**Files:**
- Create: `app/(tools)/text-to-html/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/(tools)/text-to-html/page.tsx
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
    a.click()
    URL.revokeObjectURL(url)
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tools)/text-to-html/page.tsx"
git commit -m "feat(text-to-html): add page with split-pane editor and live preview"
```

---

## Task 4: Register in tool catalog

**Files:**
- Modify: `content/tool-catalog.ts` (around line 145, after `regex-tester`)

- [ ] **Step 1: Add the tool entry**

Find the line:
```typescript
  { slug: 'regex-tester',    title: 'Regex Tester',    description: 'Test regex patterns with live matches.', category: 'developer', status: 'live' },
```

Add immediately after:
```typescript
  { slug: 'text-to-html',    title: 'Text to HTML',    description: 'Convert Markdown or plain text to a full HTML document.', category: 'developer', status: 'live' },
```

- [ ] **Step 2: Verify the dev server shows it**

```bash
npm run dev
```

Open `http://localhost:3000/developer` — "Text to HTML" should appear in the tool grid.
Open `http://localhost:3000/text-to-html` — the page should load with the split-pane UI.

Paste this test input and confirm the preview renders a GitHub-styled document:
```markdown
# Hello World

This is **bold** and this is *italic*.

- Item one
- Item two

[ConvertYard](https://convertyard.com)
```

- [ ] **Step 3: Commit**

```bash
git add content/tool-catalog.ts
git commit -m "feat(text-to-html): register in developer tool catalog"
```

---

## Done

All 4 tasks complete = tool is live at `/text-to-html` and listed in `/developer`.

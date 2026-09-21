/**
 * Markdown → HTML pipeline for the live Editor preview.
 * Lazy-loads markdown-it plugins, highlight.js, KaTeX, and Mermaid only when
 * the source uses them.
 */

let cachedMd: unknown = null

interface PreviewOptions {
  enableMath?: boolean
  enableMermaid?: boolean
  enableHighlight?: boolean
}

async function getMarkdownIt(opts: PreviewOptions) {
  if (cachedMd) return cachedMd as { render: (s: string) => string }

  const MarkdownIt = (await import('markdown-it')).default
  const taskLists = (await import('markdown-it-task-lists')).default

  let highlight: ((str: string, lang: string) => string) | undefined
  if (opts.enableHighlight) {
    const hljs = (await import('highlight.js')).default
    highlight = (str: string, lang: string) => {
      if (lang === 'mermaid') {
        return `<div class="mermaid">${escapeHtml(str)}</div>`
      }
      if (lang && hljs.getLanguage(lang)) {
        try {
          return (
            '<pre class="hljs"><code>' +
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
            '</code></pre>'
          )
        } catch {
          /* noop */
        }
      }
      return '<pre class="hljs"><code>' + escapeHtml(str) + '</code></pre>'
    }
  }

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: false,
    highlight,
  }).use(taskLists, { enabled: true, label: true })

  // Callout admonitions: > [!NOTE] ...
  const defaultRender =
    md.renderer.rules.blockquote_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
    // Peek at next inline for [!TYPE]
    for (let i = idx + 1; i < tokens.length; i++) {
      if (tokens[i].type === 'blockquote_close') break
      if (tokens[i].type === 'inline') {
        const m = /^\s*\[!(NOTE|TIP|WARNING|DANGER|CAUTION|IMPORTANT)\]\s*/.exec(tokens[i].content)
        if (m) {
          const type = m[1].toLowerCase()
          tokens[i].content = tokens[i].content.replace(m[0], '')
          if (tokens[i].children) {
            const first = tokens[i].children![0]
            if (first && first.type === 'text') {
              first.content = first.content.replace(m[0], '')
            }
          }
          return `<blockquote class="callout callout-${type}"><div class="callout-label">${m[1]}</div>`
        }
        break
      }
    }
    return defaultRender(tokens, idx, options, env, self)
  }

  if (opts.enableMath) {
    // Simple KaTeX-friendly wrapper: replace $$...$$ blocks and $...$ inlines
    // with rendered HTML during preview by post-processing.
    // Actual KaTeX rendering is applied after HTML is inserted (see renderMathIn).
  }

  cachedMd = md
  return md as unknown as { render: (s: string) => string }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export function stripFrontMatter(source: string): string {
  return source.replace(FM_RE, '')
}

export async function renderMarkdown(source: string, opts: PreviewOptions = {}): Promise<string> {
  const body = stripFrontMatter(source)
  const detectMermaid = /```mermaid/.test(body)
  const detectMath = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/.test(body)
  const md = await getMarkdownIt({
    enableHighlight: opts.enableHighlight !== false,
    enableMath: (opts.enableMath ?? true) && detectMath,
    enableMermaid: (opts.enableMermaid ?? true) && detectMermaid,
  })
  let html = md.render(body)
  if ((opts.enableMath ?? true) && detectMath) {
    html = await renderMath(html)
  }
  return html
}

async function renderMath(html: string): Promise<string> {
  const katex = (await import('katex')).default
  // Block math: $$...$$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => {
    try {
      return katex.renderToString(tex, { displayMode: true, throwOnError: false })
    } catch {
      return `<code>${escapeHtml(tex)}</code>`
    }
  })
  // Inline math: $...$
  html = html.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_m, tex: string) => {
    try {
      return katex.renderToString(tex, { displayMode: false, throwOnError: false })
    } catch {
      return `<code>${escapeHtml(tex)}</code>`
    }
  })
  return html
}

let mermaidLoaded = false
export async function initMermaid(): Promise<void> {
  if (mermaidLoaded) return
  const mermaid = (await import('mermaid')).default
  mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
  mermaidLoaded = true
}

export async function renderMermaidIn(container: HTMLElement): Promise<void> {
  const diagrams = container.querySelectorAll('div.mermaid')
  if (diagrams.length === 0) return
  await initMermaid()
  const mermaid = (await import('mermaid')).default
  let idx = 0
  for (const el of Array.from(diagrams)) {
    const src = el.textContent ?? ''
    try {
      const { svg } = await mermaid.render(`mmd-${Date.now()}-${idx++}`, src)
      el.innerHTML = svg
      el.classList.add('mermaid-rendered')
    } catch (err) {
      el.innerHTML = `<pre style="color:#c00">Diagram error: ${
        err instanceof Error ? escapeHtml(err.message) : 'unknown'
      }</pre>`
    }
  }
}

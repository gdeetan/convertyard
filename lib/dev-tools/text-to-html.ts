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
  return marked.parse(stripFrontmatter(text), { async: false })
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
  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
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
  const strippedText = resolvedFormat === 'markdown' ? stripFrontmatter(text) : text
  const body =
    resolvedFormat === 'markdown'
      ? convertMarkdown(text)
      : convertPlainText(text)
  const title = extractTitle(strippedText, resolvedFormat)
  return { html: buildDocument(body, title), format: resolvedFormat }
}

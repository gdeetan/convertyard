/**
 * Markdown → RenderToken[] pipeline for PDF export.
 * Shared by markdownToPdf batch mode and the live Editor "Download PDF" flow.
 */

import type { RenderToken } from './pdf'
import { sanitizePdfText } from './pdf'

export interface FrontMatter {
  title?: string
  subtitle?: string
  author?: string
  date?: string
  [key: string]: unknown
}

export interface ParseResult {
  tokens: RenderToken[]
  frontMatter: FrontMatter | null
  headings: Array<{ level: number; text: string }>
}

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

const sanitize = sanitizePdfText

async function extractFrontMatter(source: string): Promise<{ body: string; fm: FrontMatter | null }> {
  const match = FRONT_MATTER_RE.exec(source)
  if (!match) return { body: source, fm: null }
  try {
    const { load } = await import('js-yaml')
    const fm = load(match[1]) as FrontMatter
    return { body: source.slice(match[0].length), fm: fm && typeof fm === 'object' ? fm : null }
  } catch {
    return { body: source, fm: null }
  }
}

type MdToken = {
  type: string
  tag?: string
  content?: string
  info?: string
  level?: number
  markup?: string
  children?: MdToken[]
  attrs?: Array<[string, string]> | null
  hidden?: boolean
}

function attr(t: MdToken, name: string): string | undefined {
  if (!t.attrs) return undefined
  const found = t.attrs.find(([k]) => k === name)
  return found?.[1]
}

function parseInlineChildren(
  children: MdToken[] | undefined,
): Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean; strike?: boolean; link?: string }> {
  const out: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean; strike?: boolean; link?: string }> =
    []
  if (!children) return out
  const stack: { bold?: boolean; italic?: boolean; strike?: boolean; link?: string }[] = [{}]
  const top = () => stack[stack.length - 1]
  for (const c of children) {
    const state = top()
    switch (c.type) {
      case 'text':
        if (c.content) out.push({ text: sanitize(c.content), ...state })
        break
      case 'code_inline':
        out.push({ text: sanitize(c.content ?? ''), code: true, ...state })
        break
      case 'softbreak':
      case 'hardbreak':
        out.push({ text: ' ' })
        break
      case 'strong_open':
        stack.push({ ...state, bold: true })
        break
      case 'strong_close':
        stack.pop()
        break
      case 'em_open':
        stack.push({ ...state, italic: true })
        break
      case 'em_close':
        stack.pop()
        break
      case 's_open':
        stack.push({ ...state, strike: true })
        break
      case 's_close':
        stack.pop()
        break
      case 'link_open':
        stack.push({ ...state, link: attr(c, 'href') })
        break
      case 'link_close':
        stack.pop()
        break
      case 'image': {
        const alt = c.content ?? ''
        if (alt) out.push({ text: `[${sanitize(alt)}]`, italic: true })
        break
      }
      default:
        if (c.content) out.push({ text: sanitize(c.content), ...state })
    }
  }
  return out
}

function textFromChildren(children: MdToken[] | undefined): string {
  if (!children) return ''
  let out = ''
  for (const c of children) {
    if (c.type === 'text' || c.type === 'code_inline') out += c.content ?? ''
    else if (c.type === 'softbreak' || c.type === 'hardbreak') out += ' '
  }
  return sanitize(out)
}

function detectCallout(paragraphText: string): { variant: 'note' | 'tip' | 'warning' | 'danger'; body: string } | null {
  // GitHub-style callouts: > [!NOTE] body
  const m = /^\s*\[!(NOTE|TIP|WARNING|DANGER|CAUTION|IMPORTANT)\]\s*([\s\S]*)$/.exec(paragraphText)
  if (!m) return null
  const raw = m[1].toUpperCase()
  const variant =
    raw === 'TIP' ? 'tip' : raw === 'WARNING' || raw === 'CAUTION' ? 'warning' : raw === 'DANGER' ? 'danger' : 'note'
  return { variant, body: m[2].trim() }
}

async function tokensToRender(mdTokens: MdToken[]): Promise<{
  tokens: RenderToken[]
  headings: Array<{ level: number; text: string }>
}> {
  const out: RenderToken[] = []
  const headings: Array<{ level: number; text: string }> = []
  let i = 0
  let listStack: Array<{ ordered: boolean; index: number }> = []

  while (i < mdTokens.length) {
    const t = mdTokens[i]

    if (t.type === 'heading_open') {
      const level = Math.min(6, Math.max(1, parseInt(t.tag?.slice(1) ?? '1', 10) || 1)) as 1 | 2 | 3 | 4 | 5 | 6
      const inline = mdTokens[i + 1]
      const text = textFromChildren(inline?.children)
      headings.push({ level, text })
      out.push({
        type: 'heading',
        level,
        text,
        inline: parseInlineChildren(inline?.children),
      })
      i += 3 // heading_open, inline, heading_close
      continue
    }

    if (t.type === 'paragraph_open') {
      const inline = mdTokens[i + 1]
      const text = textFromChildren(inline?.children)
      const callout = detectCallout(text)
      if (callout) {
        out.push({ type: 'callout', variant: callout.variant, text: callout.body })
      } else {
        out.push({
          type: 'paragraph',
          text,
          inline: parseInlineChildren(inline?.children),
        })
      }
      i += 3
      continue
    }

    if (t.type === 'hr') {
      out.push({ type: 'rule', text: '' })
      i++
      continue
    }

    if (t.type === 'fence' || t.type === 'code_block') {
      out.push({
        type: 'code-block',
        text: t.content ?? '',
        lang: (t.info ?? '').split(/\s+/)[0] || undefined,
      })
      i++
      continue
    }

    if (t.type === 'blockquote_open') {
      // Collect nested tokens until blockquote_close, concatenate paragraph texts.
      let depth = 1
      let j = i + 1
      const inner: string[] = []
      while (j < mdTokens.length && depth > 0) {
        if (mdTokens[j].type === 'blockquote_open') depth++
        else if (mdTokens[j].type === 'blockquote_close') depth--
        else if (mdTokens[j].type === 'inline') inner.push(textFromChildren(mdTokens[j].children))
        j++
      }
      const joined = inner.join(' ')
      const callout = detectCallout(joined)
      if (callout) {
        out.push({ type: 'callout', variant: callout.variant, text: callout.body })
      } else {
        out.push({ type: 'blockquote', text: joined })
      }
      i = j
      continue
    }

    if (t.type === 'bullet_list_open') {
      listStack.push({ ordered: false, index: 1 })
      i++
      continue
    }
    if (t.type === 'ordered_list_open') {
      listStack.push({ ordered: true, index: 1 })
      i++
      continue
    }
    if (t.type === 'bullet_list_close' || t.type === 'ordered_list_close') {
      listStack.pop()
      i++
      continue
    }
    if (t.type === 'list_item_open') {
      // Look ahead for paragraph inline
      let text = ''
      let checked: boolean | undefined
      let taskItem = false
      let j = i + 1
      let depth = 1
      while (j < mdTokens.length && depth > 0) {
        const inner = mdTokens[j]
        if (inner.type === 'list_item_open') depth++
        else if (inner.type === 'list_item_close') depth--
        if (depth === 0) break
        if (inner.type === 'inline') {
          const raw = textFromChildren(inner.children)
          // Task list marker: markdown-it-task-lists puts [x] / [ ] in first child
          const taskMatch = /^\s*\[([ xX])\]\s+([\s\S]*)$/.exec(raw)
          if (taskMatch && !text) {
            taskItem = true
            checked = taskMatch[1].toLowerCase() === 'x'
            text = taskMatch[2]
          } else if (!text) {
            text = raw
          }
        }
        j++
      }
      const list = listStack[listStack.length - 1]
      if (taskItem) {
        out.push({ type: 'task-item', text, checked })
      } else {
        out.push({
          type: 'list-item',
          text,
          ordered: list?.ordered ?? false,
          index: list ? list.index++ : 1,
        })
      }
      i = j + 1
      continue
    }

    if (t.type === 'table_open') {
      // Parse table: expect thead > tr > th..., tbody > tr > td...
      let j = i + 1
      let headers: string[] = []
      let rows: string[][] = []
      let current: string[] = []
      let inThead = false
      while (j < mdTokens.length && mdTokens[j].type !== 'table_close') {
        const t2 = mdTokens[j]
        if (t2.type === 'thead_open') inThead = true
        else if (t2.type === 'thead_close') inThead = false
        else if (t2.type === 'tr_open') current = []
        else if (t2.type === 'tr_close') {
          if (inThead) headers = current
          else rows.push(current)
        } else if (t2.type === 'th_open' || t2.type === 'td_open') {
          const inline = mdTokens[j + 1]
          current.push(textFromChildren(inline?.children))
        }
        j++
      }
      out.push({ type: 'table', text: '', headers, rows })
      i = j + 1
      continue
    }

    if (t.type === 'html_block') {
      const html = t.content ?? ''
      // Explicit page break marker
      if (/<!--\s*pagebreak\s*-->/i.test(html) || /<div\s+class=["']page-break["']/i.test(html)) {
        out.push({ type: 'page-break', text: '' })
      }
      i++
      continue
    }

    // Skip everything else safely
    i++
  }

  return { tokens: out, headings }
}

export async function parseMarkdown(source: string): Promise<ParseResult> {
  const { body, fm } = await extractFrontMatter(source)
  const MarkdownIt = (await import('markdown-it')).default
  const taskLists = (await import('markdown-it-task-lists')).default
  const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false }).use(taskLists, {
    enabled: true,
  })
  const mdTokens = md.parse(body, {}) as unknown as MdToken[]
  const { tokens, headings } = await tokensToRender(mdTokens)
  return { tokens, frontMatter: fm, headings }
}

export function buildCoverToken(fm: FrontMatter | null, fallbackTitle?: string): RenderToken | null {
  if (!fm) return null
  const title = typeof fm.title === 'string' ? fm.title : fallbackTitle
  if (!title) return null
  return {
    type: 'cover',
    text: title,
    title,
    subtitle: typeof fm.subtitle === 'string' ? fm.subtitle : undefined,
    author: typeof fm.author === 'string' ? fm.author : undefined,
    date:
      typeof fm.date === 'string'
        ? fm.date
        : (fm.date as unknown) instanceof Date
          ? (fm.date as unknown as Date).toISOString().slice(0, 10)
          : undefined,
  }
}

export function buildTocToken(headings: Array<{ level: number; text: string }>): RenderToken | null {
  const entries = headings.filter(h => h.level <= 3)
  if (entries.length === 0) return null
  return { type: 'toc', text: 'Table of Contents', entries }
}

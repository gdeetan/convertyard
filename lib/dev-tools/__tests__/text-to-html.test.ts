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
  it('extracts first heading from markdown', () => {
    expect(extractTitle('# My Title\n\nContent', 'markdown')).toBe('My Title')
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
  it('includes escaped title tag', () => {
    expect(buildDocument('<p>Hi</p>', 'My & Doc')).toContain('<title>My &amp; Doc</title>')
  })
  it('wraps content in body with markdown-body class', () => {
    const result = buildDocument('<p>Hi</p>', 'Test')
    expect(result).toContain('<body class="markdown-body">')
    expect(result).toContain('<p>Hi</p>')
  })
  it('inlines github css', () => {
    expect(buildDocument('<p>Hi</p>', 'Test')).toContain('.markdown-body')
  })
  it('escapes < in title', () => {
    expect(buildDocument('', 'a<b')).toContain('<title>a&lt;b</title>')
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
  it('ignores frontmatter in title extraction for markdown', () => {
    const { html } = convertTextToHtml('---\ntitle: Frontmatter\n---\n# Real Title')
    expect(html).toContain('<title>Real Title</title>')
  })
})

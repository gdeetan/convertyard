import { describe, it, expect } from 'vitest'
import { filterTools } from '../filter-tools'
import type { CatalogTool } from '@/content/tool-catalog'

function makeTool(overrides: Partial<CatalogTool> & Pick<CatalogTool, 'slug' | 'title'>): CatalogTool {
  return {
    description: 'A test tool.',
    category: 'images',
    status: 'live',
    ...overrides,
  }
}

const TOOLS: CatalogTool[] = [
  makeTool({ slug: 'jpg-to-webp', title: 'JPG to WebP', description: 'Shrink JPGs without visible loss.' }),
  makeTool({ slug: 'png-to-webp', title: 'PNG to WebP', description: 'Smaller PNGs for the web.' }),
  makeTool({ slug: 'compress-pdf', title: 'Compress PDF', description: 'Shrink PDFs without destroying quality.' }),
  makeTool({ slug: 'coming-soon', title: 'Future Tool', description: 'WebP related coming soon.', status: 'coming-soon' }),
]

describe('filterTools', () => {
  it('returns empty array for empty query', () => {
    expect(filterTools(TOOLS, '')).toEqual([])
  })

  it('returns empty array for whitespace-only query', () => {
    expect(filterTools(TOOLS, '   ')).toEqual([])
  })

  it('matches on title (case-insensitive)', () => {
    const results = filterTools(TOOLS, 'WEBP')
    expect(results.map((t) => t.slug)).toContain('jpg-to-webp')
    expect(results.map((t) => t.slug)).toContain('png-to-webp')
  })

  it('excludes coming-soon tools', () => {
    const results = filterTools(TOOLS, 'webp')
    expect(results.map((t) => t.slug)).not.toContain('coming-soon')
  })

  it('matches on description when title does not match', () => {
    const results = filterTools(TOOLS, 'quality')
    expect(results.map((t) => t.slug)).toContain('compress-pdf')
  })

  it('ranks title matches above description matches', () => {
    const tools: CatalogTool[] = [
      makeTool({ slug: 'desc-match', title: 'Unrelated Tool', description: 'Works with WebP files.' }),
      makeTool({ slug: 'title-match', title: 'WebP Converter', description: 'Some description.' }),
    ]
    const results = filterTools(tools, 'webp')
    expect(results[0].slug).toBe('title-match')
  })

  it('respects maxResults cap', () => {
    const manyTools: CatalogTool[] = Array.from({ length: 20 }, (_, i) =>
      makeTool({ slug: `tool-${i}`, title: `WebP Tool ${i}` })
    )
    expect(filterTools(manyTools, 'webp', 5)).toHaveLength(5)
  })
})

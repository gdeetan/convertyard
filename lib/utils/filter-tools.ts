import type { CatalogTool } from '@/content/tool-catalog'

export function filterTools(
  tools: CatalogTool[],
  query: string,
  maxResults = 8,
): CatalogTool[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const titleMatches: CatalogTool[] = []
  const descriptionMatches: CatalogTool[] = []

  for (const tool of tools) {
    if (tool.status !== 'live') continue
    const inTitle = tool.title.toLowerCase().includes(q)
    const inDesc = tool.description.toLowerCase().includes(q)
    if (inTitle) {
      titleMatches.push(tool)
    } else if (inDesc) {
      descriptionMatches.push(tool)
    }
  }

  return [...titleMatches, ...descriptionMatches].slice(0, maxResults)
}

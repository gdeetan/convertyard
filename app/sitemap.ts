// app/sitemap.ts
export const dynamic = 'force-static'

import type { MetadataRoute } from 'next'
import { tools } from '@/content/tool-registry'

const BASE_URL = 'https://convertyard.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${BASE_URL}/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...toolEntries,
  ]
}

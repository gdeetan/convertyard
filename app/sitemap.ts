// app/sitemap.ts
export const dynamic = 'force-static'

import type { MetadataRoute } from 'next'
import { tools }        from '@/content/tool-registry'
import { textTools }    from '@/content/text-tool-registry'
import { articles }     from '@/content/article-registry'
import { sizeTargets }  from '@/content/size-target-registry'
import { verticals }    from '@/content/vertical-registry'
import { BASE_URL }     from '@/lib/seo/schema'

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${BASE_URL}/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const textToolEntries: MetadataRoute.Sitemap = textTools.map((t) => ({
    url: `${BASE_URL}/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}/`,
    lastModified: new Date(a.lastUpdated),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const sizeTargetEntries: MetadataRoute.Sitemap = sizeTargets.map((t) => ({
    url: `${BASE_URL}/${t.parentTool}/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  const verticalEntries: MetadataRoute.Sitemap = verticals.map((v) => ({
    url: `${BASE_URL}/for/${v.slug}/`,
    lastModified: new Date(v.lastUpdated),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/tools/`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.95 },
    { url: `${BASE_URL}/blog/`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8  },
    { url: `${BASE_URL}/images/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/pdf/`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/video-audio/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/developer/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/web-tools/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/ai-tools/`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/for/`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/about/`,                          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/convertyard-vs-smallpdf/`,       lastModified: new Date('2026-04-22'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/convertyard-vs-convertio/`,      lastModified: new Date('2026-05-09'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/convertyard-vs-ilovepdf/`,       lastModified: new Date('2026-05-28'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/convertyard-vs-adobe-acrobat/`,  lastModified: new Date('2026-06-17'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/how-it-works/`,lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.6  },
    { url: `${BASE_URL}/privacy/`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5  },
    { url: `${BASE_URL}/terms/`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5  },
  ]

  return [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    ...staticEntries,
    ...toolEntries,
    ...textToolEntries,
    ...articleEntries,
    ...sizeTargetEntries,
    ...verticalEntries,
  ]
}

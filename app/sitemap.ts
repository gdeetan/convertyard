// app/sitemap.ts
export const dynamic = 'force-static'

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { MetadataRoute } from 'next'
import { tools }        from '@/content/tool-registry'
import { textTools }    from '@/content/text-tool-registry'
import { articles }     from '@/content/article-registry'
import { sizeTargets }  from '@/content/size-target-registry'
import { verticals }    from '@/content/vertical-registry'
import { ALL_TOOLS }    from '@/content/tool-catalog'
import { BASE_URL }     from '@/lib/seo/schema'

const BUILD_DATE = new Date()

// Derive last commit date for a tool page from git. Returns undefined if
// the file has no git history (new/uncommitted) or git is unavailable.
function gitLastModified(slug: string): Date | undefined {
  const pagePath = join('app', '(tools)', slug, 'page.tsx')
  if (!existsSync(pagePath)) return undefined
  try {
    const out = execSync(`git log -1 --format=%cI -- "${pagePath}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return out ? new Date(out) : undefined
  } catch {
    return undefined
  }
}

function resolveToolLastMod(slug: string, manual?: string): Date | undefined {
  if (manual) return new Date(manual)
  return gitLastModified(slug)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const catalogBySlug = new Map(ALL_TOOLS.map((t) => [t.slug, t]))

  const toolEntries: MetadataRoute.Sitemap = tools.map((t) => {
    const lastMod = resolveToolLastMod(t.slug, catalogBySlug.get(t.slug)?.lastUpdated)
    return {
      url: `${BASE_URL}/${t.slug}/`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  const textToolEntries: MetadataRoute.Sitemap = textTools.map((t) => {
    const lastMod = resolveToolLastMod(t.slug, catalogBySlug.get(t.slug)?.lastUpdated)
    return {
      url: `${BASE_URL}/${t.slug}/`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  // Catalog-only entries: live tool pages present on disk and in ALL_TOOLS
  // but not wired through the shared-shell registries above. Emitted at a
  // slightly lower priority since they lack registry-driven cross-linking.
  const registrySlugs = new Set([
    ...tools.map((t) => t.slug),
    ...textTools.map((t) => t.slug),
  ])
  const catalogOnlyEntries: MetadataRoute.Sitemap = ALL_TOOLS
    .filter((t) => t.status === 'live' && !registrySlugs.has(t.slug))
    .map((t) => {
      const lastMod = resolveToolLastMod(t.slug, t.lastUpdated)
      return {
        url: `${BASE_URL}/${t.slug}/`,
        ...(lastMod ? { lastModified: lastMod } : {}),
        changeFrequency: 'monthly',
        priority: 0.7,
      }
    })

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}/`,
    lastModified: new Date(a.lastUpdated),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const sizeTargetEntries: MetadataRoute.Sitemap = sizeTargets.map((t) => ({
    url: `${BASE_URL}/${t.parentTool}/${t.slug}/`,
    lastModified: BUILD_DATE,
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
    { url: `${BASE_URL}/tools/`,       lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.95 },
    { url: `${BASE_URL}/blog/`,        lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.8  },
    { url: `${BASE_URL}/images/`,      lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/pdf/`,         lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/video-audio/`, lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/developer/`,   lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/web-tools/`,   lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/ai-tools/`,    lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/for/`,         lastModified: BUILD_DATE, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/about/`,                          lastModified: BUILD_DATE, changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/convertyard-vs-smallpdf/`,       lastModified: new Date('2026-04-22'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/convertyard-vs-convertio/`,      lastModified: new Date('2026-05-09'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/convertyard-vs-ilovepdf/`,       lastModified: new Date('2026-05-28'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/convertyard-vs-adobe-acrobat/`,  lastModified: new Date('2026-06-17'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/convertyard-vs-cloudconvert/`,   lastModified: new Date('2026-07-04'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/gdpr-compliant-file-converter/`, lastModified: BUILD_DATE, changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/how-it-works/`,lastModified: BUILD_DATE, changeFrequency: 'yearly',  priority: 0.6  },
    { url: `${BASE_URL}/privacy/`,     lastModified: BUILD_DATE, changeFrequency: 'yearly',  priority: 0.5  },
    { url: `${BASE_URL}/terms/`,       lastModified: BUILD_DATE, changeFrequency: 'yearly',  priority: 0.5  },
  ]

  return [
    { url: `${BASE_URL}/`, lastModified: BUILD_DATE, changeFrequency: 'weekly', priority: 1.0 },
    ...staticEntries,
    ...toolEntries,
    ...textToolEntries,
    ...catalogOnlyEntries,
    ...articleEntries,
    ...sizeTargetEntries,
    ...verticalEntries,
  ]
}

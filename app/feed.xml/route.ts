export const dynamic = 'force-static'

import { articles } from '@/content/article-registry'
import { BASE_URL } from '@/lib/seo/schema'

const SITE_TITLE = 'ConvertYard Blog'
const SITE_DESCRIPTION =
  'Guides, comparisons, and deep dives on local-first file conversion — image formats, PDF workflows, video codecs, and privacy.'

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET(): Response {
  const sorted = [...articles].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )
  const lastBuild = sorted[0]
    ? new Date(sorted[0].lastUpdated).toUTCString()
    : new Date().toUTCString()

  const items = sorted
    .map((a) => {
      const url = `${BASE_URL}/blog/${a.slug}/`
      const pubDate = new Date(a.lastUpdated).toUTCString()
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(a.description)}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}/blog/</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}

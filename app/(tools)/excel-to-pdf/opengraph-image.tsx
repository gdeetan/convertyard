import { OG_SIZE, makeOgResponse } from '@/lib/seo/og-image'
import { config } from '@/content/tools/excel-to-pdf'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = config.title

export default function Image() {
  return makeOgResponse({
    title: config.title,
    subtitle: config.subtitle,
  })
}

import { OG_SIZE, makeOgResponse } from '@/lib/seo/og-image'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Regex Tester — ConvertYard'

export default function Image() {
  return makeOgResponse({
    title: 'Regex Tester',
    subtitle: 'Test regex patterns with live matches.',
  })
}

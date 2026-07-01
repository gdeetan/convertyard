import { OG_SIZE, makeOgResponse } from '@/lib/seo/og-image'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Diff Checker — ConvertYard'

export default function Image() {
  return makeOgResponse({
    title: 'Diff Checker',
    subtitle: 'Visual diff for text and code.',
  })
}

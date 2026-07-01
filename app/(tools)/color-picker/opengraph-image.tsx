import { OG_SIZE, makeOgResponse } from '@/lib/seo/og-image'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Color Picker — ConvertYard'

export default function Image() {
  return makeOgResponse({
    title: 'Color Picker',
    subtitle: 'Pick colors and export in any format.',
  })
}

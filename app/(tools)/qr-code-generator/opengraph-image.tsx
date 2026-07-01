import { OG_SIZE, makeOgResponse } from '@/lib/seo/og-image'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'QR Code Generator — ConvertYard'

export default function Image() {
  return makeOgResponse({
    title: 'QR Code Generator',
    subtitle: 'Generate QR codes for any URL.',
  })
}

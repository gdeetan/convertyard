import { OG_SIZE, makeOgResponse } from '@/lib/seo/og-image'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Text to HTML Converter — ConvertYard'

export default function Image() {
  return makeOgResponse({
    title: 'Text to HTML Converter',
    subtitle: 'Convert Markdown or plain text to HTML in your browser.',
  })
}

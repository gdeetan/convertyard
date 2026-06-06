import type { Metadata } from 'next'
import { SiteShell } from '@/components/site-shell/site-shell'
import { GA4 } from '@/components/analytics/ga4'
import { CookieBanner } from '@/components/site-shell/cookie-banner'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://convertyard.com'),
  title: {
    default: 'ConvertYard — Local-first conversion, built for batches',
    template: '%s — ConvertYard',
  },
  description:
    'Batch file conversion in your browser. No uploads. No signups. Up to 1,000 files at once.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
        <GA4 />
        <CookieBanner />
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { SiteShell } from '@/components/site-shell/site-shell'
import { GA4 } from '@/components/analytics/ga4'
import { CookieBanner } from '@/components/site-shell/cookie-banner'
import './globals.css'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#C2410C' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1917' },
  ],
}

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
    other: [
      { rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'ConvertYard Blog' },
      ],
    },
  },
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

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ConvertYard — Local-first conversion, built for batches.',
  description:
    'Batch file conversion in your browser. No uploads. No signups. Up to 1,000 files at once.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

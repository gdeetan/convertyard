import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free EXIF Viewer — Batch HEIC, RAW & JPG | ConvertYard',
  description:
    'Free EXIF viewer for JPG, HEIC, RAW, PNG, and WebP. Check GPS, camera, IPTC, and AI-generation tags for up to 1,000 files at once — all in your browser. No uploads.',
  alternates: { canonical: 'https://convertyard.com/exif-viewer' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

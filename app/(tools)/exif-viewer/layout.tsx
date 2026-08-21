import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EXIF Viewer — ConvertYard',
  description:
    'View EXIF, IPTC, XMP, and GPS metadata from JPG, HEIC, RAW, and more — right in your browser. Batch up to 1000 files. Files never uploaded.',
  alternates: { canonical: 'https://convertyard.com/exif-viewer' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free EXIF Metadata Viewer - Images, PDFs & Videos',
  description:
    'Access EXIF data on your photos, PDF, or video files with this free tool and remove it before uploading to any site. Nothing uploads so your data is safe.',
  alternates: { canonical: 'https://convertyard.com/exif-viewer' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

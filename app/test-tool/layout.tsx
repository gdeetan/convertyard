import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Test Tool — ConvertYard' },
  description: 'Internal ToolShell test page. Not for public use.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

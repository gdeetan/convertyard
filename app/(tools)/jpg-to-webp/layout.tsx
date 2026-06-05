import { config } from '@/content/tools/jpg-to-webp'
import type { Metadata } from 'next'

export const metadata: Metadata = config.meta

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

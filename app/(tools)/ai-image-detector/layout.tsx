import type { Metadata } from 'next'
import { detectorOnnxUrl } from '@/lib/converters/ai-detector-logic'

export const metadata: Metadata = {
  title: 'Free AI Image Detector — Batch, In Browser | ConvertYard',
  description:
    'Free AI image detector. Check ChatGPT, Flux, Midjourney, Stable Diffusion, and camera photos — up to 1,000 files at once, all in your browser. No uploads.',
  alternates: { canonical: 'https://convertyard.com/ai-image-detector' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="preload"
        href={detectorOnnxUrl()}
        as="fetch"
        crossOrigin="anonymous"
      />
      {children}
    </>
  )
}

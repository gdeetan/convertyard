import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free AI Image Detector — Batch, In Browser | ConvertYard',
  description:
    'Free AI image detector. Check if a photo was made by Midjourney, DALL·E, Stable Diffusion, or a camera — up to 1,000 files at once, all in your browser. No uploads.',
  alternates: { canonical: 'https://convertyard.com/ai-image-detector' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

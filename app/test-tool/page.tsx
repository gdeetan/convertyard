'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import type { ToolConfig, ConversionResult } from '@/lib/types'

// Stub: simulates per-file progress over ~1.5s, with one intentional error
async function stubConvert(
  files: File[],
  _options: Record<string, unknown>,
  onProgress?: (i: number, pct: number) => void
): Promise<ConversionResult[]> {
  return Promise.all(
    files.map(async (file, i) => {
      for (let p = 0; p <= 100; p += 20) {
        await new Promise<void>((r) => setTimeout(r, 150))
        onProgress?.(i, p)
      }
      // Simulate an error on the third file
      if (i === 2) return new Error('Simulated error — third file always fails')
      // Return same file (real tools would return a converted File)
      return new File([file], file.name.replace(/\.\w+$/, '.out'), { type: file.type })
    })
  )
}

const testConfig: ToolConfig = {
  slug: 'test-tool',
  title: 'Test Tool',
  subtitle: 'Local-first file processing. Built for batches.',
  category: 'images',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'],
  outputExt: '.out',
  convertFn: stubConvert,
  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 is the sweet spot for most images',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Larger files, perfect quality',
    },
    {
      type: 'dropdown',
      name: 'format',
      label: 'Output format',
      choices: [
        { value: 'webp', label: 'WebP' },
        { value: 'avif', label: 'AVIF' },
        { value: 'jpeg', label: 'JPEG' },
      ],
      default: 'webp',
    },
    {
      type: 'radio',
      name: 'resize',
      label: 'Resize',
      choices: [
        { value: 'none', label: 'None' },
        { value: '1080', label: '1080px' },
        { value: '2048', label: '2048px' },
      ],
      default: 'none',
    },
    {
      type: 'number',
      name: 'maxWidth',
      label: 'Max width (px)',
      min: 100,
      max: 8000,
      step: 100,
      default: 1920,
    },
  ],
  faq: [
    {
      q: 'Do files get uploaded to a server?',
      a: 'No. All processing happens in your browser via WebAssembly. Your files never leave your device.',
    },
    {
      q: 'What is the maximum number of files I can convert?',
      a: 'Up to 1,000 files per batch. If you need more, run multiple batches.',
    },
    {
      q: 'Why did one of my files fail?',
      a: 'This test tool intentionally fails the third file to demonstrate error handling. Successful files are still available to download.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'Processing happens in-browser, so the limit is practical browser memory — typically a few hundred MB per file. Batch size is bounded by available RAM.',
    },
  ],
  relatedTools: ['jpg-to-webp', 'png-to-avif', 'heic-to-jpg', 'image-resizer'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'how-to-batch-convert-images'],
  meta: {
    title: 'Test Tool — ConvertYard',
    description:
      'Development test page for the ToolShell component. Tests all states: idle, converting, partial success, error.',
  },
}

export default function TestToolPage() {
  return <ToolShell config={testConfig} />
}

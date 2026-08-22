'use client'
import { useEffect } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/ai-image-detector'
import { preloadClassifier } from '@/lib/converters/ai-detector'

export default function Page() {
  useEffect(() => {
    preloadClassifier()
  }, [])

  return <ToolShell config={config} />
}

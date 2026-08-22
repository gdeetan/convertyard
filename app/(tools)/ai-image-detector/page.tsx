'use client'
import { useEffect } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/ai-image-detector'
import { preloadClassifier } from '@/lib/converters/ai-detector'
import { detectorOnnxUrl } from '@/lib/converters/ai-detector-logic'

export default function Page() {
  useEffect(() => {
    void fetch(detectorOnnxUrl(), { mode: 'cors', credentials: 'omit' }).catch(() => undefined)
    preloadClassifier()
  }, [])

  return <ToolShell config={config} />
}

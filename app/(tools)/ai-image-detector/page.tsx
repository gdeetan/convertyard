'use client'
import { useEffect } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/ai-image-detector'
import { preloadClassifier } from '@/lib/converters/ai-detector'

type IdleApi = {
  requestIdleCallback?: (cb: () => void) => number
  cancelIdleCallback?: (id: number) => void
}

export default function Page() {
  useEffect(() => {
    // Fire-and-forget: start downloading and compiling the classifier
    // while the visitor reads the page. By the time they drop files,
    // the model is warm (or fully cached from a previous visit).
    const w = window as unknown as IdleApi
    let idleId: number | null = null
    let timeoutId: number | null = null
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(preloadClassifier)
    } else {
      timeoutId = window.setTimeout(preloadClassifier, 500)
    }
    return () => {
      if (idleId != null && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleId)
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [])

  return <ToolShell config={config} />
}

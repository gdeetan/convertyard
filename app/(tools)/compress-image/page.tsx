'use client'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/compress-image'
import { verticals } from '@/content/vertical-registry'
import type { ToolOptions } from '@/lib/types'

function CompressImagePage() {
  const searchParams = useSearchParams()
  const verticalSlug = searchParams.get('vertical')

  const initialOptions = useMemo<ToolOptions | undefined>(() => {
    if (!verticalSlug) return undefined
    const vert = verticals.find((v) => v.slug === verticalSlug)
    if (!vert) return undefined
    // Find the first compress-image preset for this vertical
    const preset = vert.toolPresets.find((p) => p.toolSlug === 'compress-image')
    if (!preset?.targetBytes) return undefined
    const targetKb = Math.round(preset.targetBytes / 1024)
    return {
      maxSizeKb: targetKb,
      stripMetadata: true,
      convertToSrgb: true,
    }
  }, [verticalSlug])

  return <ToolShell config={config} initialOptions={initialOptions} />
}

export default function Page() {
  return (
    <Suspense fallback={<ToolShell config={config} />}>
      <CompressImagePage />
    </Suspense>
  )
}

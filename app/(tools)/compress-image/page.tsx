'use client'
import { Suspense, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/compress-image'
import { verticals } from '@/content/vertical-registry'
import type { ToolOptions } from '@/lib/types'

const BeforeAfterCompare = dynamic(
  () => import('@/components/ui/BeforeAfterCompare').then((m) => m.BeforeAfterCompare),
  { ssr: false },
)

const compareDemo = (
  <BeforeAfterCompare
    beforeSrc="/tools/compress-image/cargo-before.png"
    beforeAlt="Original PNG cargo illustration before compression"
    beforeLabel="PNG — 146 KB"
    afterSrc="/tools/compress-image/cargo-after.png"
    afterAlt="Same PNG after ConvertYard compression"
    afterLabel="PNG — 54 KB (63% smaller)"
    width={1888}
    height={1653}
    aspectRatio="1888 / 1653"
    caption="Real-word test with Convertyard's image compression tool: 146 KB PNG → 54 KB PNG (63% smaller) at the same 1888 × 1653 resolution. Drag the slider to compare."
  />
)

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

  return <ToolShell config={config} initialOptions={initialOptions} belowToolCard={compareDemo} />
}

export default function Page() {
  return (
    <Suspense fallback={<ToolShell config={config} belowToolCard={compareDemo} />}>
      <CompressImagePage />
    </Suspense>
  )
}

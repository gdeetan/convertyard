'use client'

import dynamic from 'next/dynamic'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-avif'

const BeforeAfterCompare = dynamic(
  () => import('@/components/ui/BeforeAfterCompare').then((m) => m.BeforeAfterCompare),
  { ssr: false },
)

export default function Page() {
  return (
    <ToolShell
      config={config}
      belowToolCard={
        <BeforeAfterCompare
          beforeSrc="/tools/jpg-to-avif/koruldi-before.jpg"
          beforeAlt="Original JPG mountain lake photo"
          beforeLabel="JPG — 1,697 KB"
          afterSrc="/tools/jpg-to-avif/koruldi-after.avif"
          afterAlt="Same photo converted to AVIF with ConvertYard"
          afterLabel="AVIF — 216 KB"
          width={1280}
          height={854}
          aspectRatio="1280 / 854"
          caption="Real conversion: 1,697 KB JPG → 216 KB AVIF (87% smaller) at the same visual quality. Drag the slider to compare."
        />
      }
    />
  )
}

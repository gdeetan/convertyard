'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { BeforeAfterCompare } from '@/components/ui/BeforeAfterCompare'
import { config } from '@/content/tools/jpg-to-webp'

export default function Page() {
  return (
    <ToolShell
      config={config}
      belowToolCard={
        <BeforeAfterCompare
          beforeSrc="/tools/jpg-to-webp/rolling-hills-before.jpg"
          beforeAlt="Original JPG landscape photo"
          beforeLabel="JPG — 24 MB"
          afterSrc="/tools/jpg-to-webp/rolling-hills-after.webp"
          afterAlt="Same photo converted to WebP with ConvertYard"
          afterLabel="WebP — 6.1 MB"
          aspectRatio="3 / 2"
          caption="Real conversion: 24 MB JPG → 6.1 MB WebP (74% smaller) at the same visual quality. Drag the slider to compare."
        />
      }
    />
  )
}

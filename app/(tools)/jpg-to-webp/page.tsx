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
          beforeSrcSet="/tools/jpg-to-webp/rolling-hills-before-800.jpg 800w, /tools/jpg-to-webp/rolling-hills-before.jpg 1600w"
          beforeAlt="Original JPG landscape photo"
          beforeLabel="JPG — 24 MB"
          afterSrc="/tools/jpg-to-webp/rolling-hills-after.webp"
          afterSrcSet="/tools/jpg-to-webp/rolling-hills-after-800.webp 800w, /tools/jpg-to-webp/rolling-hills-after.webp 1600w"
          afterAlt="Same photo converted to WebP with ConvertYard"
          afterLabel="WebP — 6.1 MB"
          sizes="(max-width: 640px) 100vw, 1024px"
          width={1600}
          height={1066}
          aspectRatio="3 / 2"
          caption="Real conversion: 24 MB JPG → 6.1 MB WebP (74% smaller) at the same visual quality. Drag the slider to compare."
        />
      }
    />
  )
}

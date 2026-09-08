'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { BeforeAfterCompare } from '@/components/ui/BeforeAfterCompare'
import { config } from '@/content/tools/heic-to-jpg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      belowToolCard={
        <BeforeAfterCompare
          beforeSrc="/articles/what-is-heic/before-heic.jpg"
          beforeSrcSet="/articles/what-is-heic/before-heic-800.jpg 800w, /articles/what-is-heic/before-heic.jpg 1600w"
          beforeAlt="Original HEIC photo from iPhone, rendered for browser preview"
          beforeLabel="HEIC — 2.8 MB"
          afterSrc="/articles/what-is-heic/after-jpg.jpg"
          afterSrcSet="/articles/what-is-heic/after-jpg-800.jpg 800w, /articles/what-is-heic/after-jpg.jpg 1600w"
          afterAlt="Same photo converted from HEIC to JPG with ConvertYard"
          afterLabel="JPG — 4.5 MB"
          sizes="(max-width: 640px) 100vw, 1024px"
          width={1600}
          height={1200}
          aspectRatio="4 / 3"
          caption="Same photo — the HEIC won't open on Windows and most Android phones, the JPG does. Drag the slider to compare."
        />
      }
    />
  )
}

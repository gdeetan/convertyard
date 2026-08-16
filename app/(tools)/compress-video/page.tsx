'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { CompressVideoEngineBanner } from '@/components/tool-shell/compress-video-engine-banner'
import { config } from '@/content/tools/compress-video'

export default function Page() {
  return <ToolShell config={config} notice={<CompressVideoEngineBanner />} />
}

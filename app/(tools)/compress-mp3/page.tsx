'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/compress-mp3'

export default function Page() {
  return <ToolShell config={config} />
}

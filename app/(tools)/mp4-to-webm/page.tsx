'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/mp4-to-webm'

export default function Page() {
  return <ToolShell config={config} />
}

'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/mp3-to-aac'

export default function Page() {
  return <ToolShell config={config} />
}

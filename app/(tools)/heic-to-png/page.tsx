'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/heic-to-png'

export default function Page() {
  return <ToolShell config={config} />
}

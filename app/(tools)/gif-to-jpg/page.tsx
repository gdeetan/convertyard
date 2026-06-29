'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/gif-to-jpg'

export default function Page() {
  return <ToolShell config={config} />
}

'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/flv-to-mp4'

export default function Page() {
  return <ToolShell config={config} />
}

'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-text'

export default function Page() {
  return <ToolShell config={config} />
}

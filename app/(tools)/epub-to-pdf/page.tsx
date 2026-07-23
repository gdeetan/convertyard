'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/epub-to-pdf'

export default function Page() {
  return <ToolShell config={config} />
}

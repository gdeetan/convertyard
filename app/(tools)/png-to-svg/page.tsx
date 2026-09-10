'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-svg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      notice={
        <p className="rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
          Drop a PNG to preview it. Zoom in to inspect edges, then click Convert to trace the SVG.
        </p>
      }
    />
  )
}

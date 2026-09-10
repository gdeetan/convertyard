'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-svg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      notice={
        <p className="rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
          Open a PNG file to preview. Adjust the presets and sliders to get the desired results in the preview window. Click ‘convert’ to convert the file. Note that even after conversion, you can tweak the presets and download the file with the updated changes.
        </p>
      }
    />
  )
}

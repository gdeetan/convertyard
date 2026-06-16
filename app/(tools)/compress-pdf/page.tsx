'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config as baseConfig } from '@/content/tools/compress-pdf'
import { CompressPdfPreviewPanel } from '@/components/pdf/CompressPdfPreviewPanel'
import { PresetBar } from '@/components/pdf/PresetBar'
import { CompressorComparisonTable } from '@/components/pdf/CompressorComparisonTable'

const config = {
  ...baseConfig,
  previewPanel: CompressPdfPreviewPanel,
  presetBar: PresetBar,
}

export default function Page() {
  return (
    <>
      <ToolShell config={config} />
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <CompressorComparisonTable />
      </div>
    </>
  )
}

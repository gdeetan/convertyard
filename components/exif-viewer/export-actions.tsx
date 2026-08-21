'use client'
import type { AnalyzeResult } from '@/lib/converters/exif-viewer.types'
import type { ViewerExportAction } from '@/lib/types'

export function ExportActions({ results, actions }: { results: AnalyzeResult[]; actions: ViewerExportAction[] }) {
  if (actions.length === 0) return null
  async function run(a: ViewerExportAction) {
    const { blob, filename } = await a.build(results)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = filename
    document.body.appendChild(link); link.click(); link.remove()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.id} onClick={() => run(a)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          {a.label}
        </button>
      ))}
    </div>
  )
}

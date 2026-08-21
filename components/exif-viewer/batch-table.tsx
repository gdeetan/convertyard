'use client'
import { useState } from 'react'
import type { AnalyzeResult, AnalyzeSuccess } from '@/lib/converters/exif-viewer.types'
import { SingleFileView } from './single-file-view'

interface Props {
  results: AnalyzeResult[]
  selected: Set<number>
  onToggleSelect: (i: number) => void
}

export function BatchTable({ results, selected, onToggleSelect }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-white shadow-sm">
          <tr className="text-left">
            <th className="w-8"></th>
            <th className="w-14"></th>
            <th className="px-2 py-2">File</th>
            <th className="px-2 py-2">Camera</th>
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">GPS</th>
            <th className="px-2 py-2">Privacy</th>
            <th className="px-2 py-2">AI</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <RowGroup key={i} idx={i} r={r} expanded={expanded === i} onExpand={() => setExpanded(expanded === i ? null : i)}
              checked={selected.has(i)} onCheck={() => onToggleSelect(i)} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RowGroup(props: { idx: number; r: AnalyzeResult; expanded: boolean; onExpand: () => void; checked: boolean; onCheck: () => void }) {
  const { r, expanded, onExpand, checked, onCheck } = props
  const camera = r.ok ? findRow(r, 'Model') ?? findRow(r, 'Make') ?? '—' : '—'
  const date   = r.ok ? findRow(r, 'DateTimeOriginal') ?? '—' : '—'
  const gps    = r.ok && r.gps ? '📍' : '—'
  const privacy = r.ok
    ? (r.privacyFlags.some(f => f.severity === 'high') ? 'High'
       : r.privacyFlags.length ? 'Some' : 'None')
    : '—'
  const ai = r.ok
    ? (r.aiSignatures.length ? r.aiSignatures[0].generator : 'No')
    : '—'
  return (
    <>
      <tr className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={onExpand}>
        <td className="px-2"><input type="checkbox" checked={checked} onClick={e => e.stopPropagation()} onChange={onCheck} /></td>
        <td className="px-2">{r.ok && r.thumbnailDataUrl ? <img src={r.thumbnailDataUrl} alt="" className="h-8 w-8 object-cover rounded" /> : null}</td>
        <td className="px-2 py-2 font-mono break-all">{r.fileName}</td>
        <td className="px-2 py-2">{camera}</td>
        <td className="px-2 py-2">{date}</td>
        <td className="px-2 py-2">{gps}</td>
        <td className="px-2 py-2">{privacy}</td>
        <td className="px-2 py-2">{ai}</td>
      </tr>
      {expanded && r.ok && (
        <tr>
          <td colSpan={8} className="bg-gray-50 p-4">
            <SingleFileView result={r} />
          </td>
        </tr>
      )}
      {expanded && !r.ok && (
        <tr><td colSpan={8} className="bg-gray-50 p-4 text-sm text-gray-700">{r.message}</td></tr>
      )}
    </>
  )
}

function findRow(r: AnalyzeSuccess, tag: string): string | undefined {
  for (const g of r.groups) {
    const row = g.rows.find(x => x.label.replace(/\s/g, '').toLowerCase() === tag.toLowerCase())
    if (row) return row.value
  }
  return undefined
}

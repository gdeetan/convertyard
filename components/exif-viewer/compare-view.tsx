'use client'
import type { AnalyzeResult, AnalyzeSuccess } from '@/lib/converters/exif-viewer.types'

export function CompareView({ a, b, onClose }: { a: AnalyzeResult; b: AnalyzeResult; onClose: () => void }) {
  if (!a.ok || !b.ok) return (
    <div className="rounded border p-4">
      <p className="text-sm">Compare only works on files whose metadata could be read.</p>
      <button className="mt-2 text-sm underline" onClick={onClose}>Close</button>
    </div>
  )
  const rows = buildDiffRows(a, b)
  return (
    <div className="rounded border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Compare — {a.fileName} vs {b.fileName}</h3>
        <button className="text-sm underline" onClick={onClose}>Close</button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-gray-500">
          <tr><th className="py-1">Tag</th><th className="py-1">{a.fileName}</th><th className="py-1">{b.fileName}</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.differ ? 'bg-yellow-50' : ''}>
              <td className="py-1 pr-4 font-mono text-xs">{r.tag}</td>
              <td className="py-1 pr-4 font-mono break-all">{r.va ?? <span className="text-gray-400">—</span>}</td>
              <td className="py-1 font-mono break-all">{r.vb ?? <span className="text-gray-400">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function buildDiffRows(a: AnalyzeSuccess, b: AnalyzeSuccess) {
  const keys = new Set([...Object.keys(a.raw), ...Object.keys(b.raw)])
  const out: { tag: string; va?: string; vb?: string; differ: boolean }[] = []
  for (const k of Array.from(keys).sort()) {
    const va = a.raw[k] === undefined ? undefined : String(a.raw[k])
    const vb = b.raw[k] === undefined ? undefined : String(b.raw[k])
    out.push({ tag: k, va, vb, differ: va !== vb })
  }
  return out
}

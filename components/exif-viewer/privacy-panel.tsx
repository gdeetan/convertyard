'use client'
import Link from 'next/link'
import type { PrivacyFlag } from '@/lib/converters/exif-viewer.types'

const SEVERITY_STYLES: Record<PrivacyFlag['severity'], string> = {
  high:   'bg-red-50 text-red-800 border-red-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  info:   'bg-blue-50 text-blue-800 border-blue-200',
}

export function PrivacyPanel({ flags }: { flags: PrivacyFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="rounded border border-green-200 bg-green-50 p-4 text-green-800">
        No obvious privacy concerns detected in this file's metadata.
      </div>
    )
  }
  return (
    <div className="rounded border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-3">Privacy audit</h3>
      <ul className="space-y-2">
        {flags.map((f, i) => (
          <li key={i} className={`flex items-start gap-3 rounded border px-3 py-2 ${SEVERITY_STYLES[f.severity]}`}>
            <span className="text-xs font-semibold uppercase tracking-wide">{f.severity}</span>
            <span className="flex-1 text-sm">{f.message} <span className="text-gray-500">({f.tag})</span></span>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-sm">
        <Link href="/edit-metadata" className="text-blue-700 underline">Strip this metadata →</Link>
      </div>
    </div>
  )
}

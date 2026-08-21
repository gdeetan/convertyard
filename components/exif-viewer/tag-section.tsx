'use client'
import { useState } from 'react'
import type { TagGroup } from '@/lib/converters/exif-viewer.types'

export function TagSection({ group, defaultOpen }: { group: TagGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-gray-200 py-3">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(o => !o)}>
        <span className="font-medium">{group.title}</span>
        <span className="text-xs text-gray-500">{group.rows.length} tags · {open ? 'hide' : 'show'}</span>
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-[minmax(0,180px)_1fr]">
          {group.rows.map((r, i) => (
            <div key={i} className="contents">
              <dt className="text-gray-500">{r.label}</dt>
              <dd className="font-mono break-all">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

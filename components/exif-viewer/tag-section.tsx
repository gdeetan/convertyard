'use client'
import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { TagGroup } from '@/lib/converters/exif-viewer.types'

export function TagSection({
  group,
  defaultOpen,
  forceOpen,
}: {
  group: TagGroup
  defaultOpen: boolean
  forceOpen?: boolean | null
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    if (forceOpen === null || forceOpen === undefined) return
    setOpen(forceOpen)
  }, [forceOpen])

  const copy = async (i: number, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(i)
      setTimeout(() => setCopied(c => (c === i ? null : c)), 1200)
    } catch { /* clipboard blocked */ }
  }

  return (
    <section className="border-t border-border py-3">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-medium text-fg">{group.title}</span>
        <span className="text-xs text-fg-subtle">{group.rows.length} tags · {open ? 'hide' : 'show'}</span>
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-1 gap-y-1 text-sm sm:grid-cols-[minmax(0,180px)_1fr]">
          {group.rows.map((r, i) => (
            <div key={i} className="contents">
              <dt className="text-fg-subtle">{r.label}</dt>
              <dd className="min-w-0">
                <button
                  type="button"
                  onClick={() => copy(i, r.value)}
                  className="group flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left font-mono break-all hover:bg-bg-muted"
                  title="Click to copy"
                >
                  <span className="min-w-0 flex-1">{r.value}</span>
                  {copied === i ? (
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <Copy className="mt-0.5 h-3 w-3 shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  )}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

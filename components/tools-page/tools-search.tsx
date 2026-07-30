'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ALL_TOOLS } from '@/content/tool-catalog'
import { highlight } from '@/lib/utils/highlight'
import { ToolSearchCombobox } from '@/components/ui/tool-search-combobox'

export function ToolsSearch() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') ?? ''
    if (q) setQuery(q)
  }, [])

  const trimmed = query.trim().toLowerCase()
  const isSearching = trimmed.length > 0
  const results = isSearching
    ? ALL_TOOLS.filter(
        (t) =>
          t.status === 'live' &&
          (t.title.toLowerCase().includes(trimmed) ||
            t.description.toLowerCase().includes(trimmed))
      )
    : []

  return (
    <div className="mb-10">
      {/* Combobox — instant jump to tool */}
      <div className="relative mb-6">
        <ToolSearchCombobox
          placeholder="Search all tools…"
          value={query}
          onChange={(val) => {
            setQuery(val)
            const url = new URL(window.location.href)
            if (val) {
              url.searchParams.set('q', val)
            } else {
              url.searchParams.delete('q')
            }
            history.replaceState(null, '', url.toString())
          }}
        />
      </div>

      {/* Card grid — browse filtered results */}
      {isSearching && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((tool) => (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className={cn(
                  'group flex flex-col rounded-2xl border border-border bg-bg-elevated p-5',
                  'transition-all duration-150',
                  'hover:-translate-y-0.5 hover:border-primary hover:shadow-md',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                )}
              >
                <h3 className="mb-1 text-sm font-semibold text-fg transition-colors group-hover:text-primary">
                  {highlight(tool.title, trimmed)}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-fg-muted">
                  {highlight(tool.description, trimmed)}
                </p>
                <div className="mt-4 flex justify-end">
                  <ArrowRight
                    className="h-4 w-4 text-fg-subtle transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center text-sm">
            {results.length === 0 ? (
              <p className="text-fg-muted">
                No tools match{' '}
                <strong className="text-fg">&ldquo;{query.trim()}&rdquo;</strong>{' '}
                — try a shorter search.
              </p>
            ) : (
              <p className="text-fg-subtle">
                {results.length} tool{results.length !== 1 ? 's' : ''}{' '}
                {results.length === 1 ? 'matches' : 'match'}{' '}
                <strong className="text-fg">&ldquo;{query.trim()}&rdquo;</strong>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ALL_TOOLS } from '@/content/tool-catalog'

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-amber-100 px-px dark:bg-amber-900/40">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

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

  const clearSearch = () => {
    setQuery('')
    const url = new URL(window.location.href)
    url.searchParams.delete('q')
    history.replaceState(null, '', url.toString())
  }

  return (
    <div className="mb-10">
      {/* Search input */}
      <div className="relative mb-6">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            const url = new URL(window.location.href)
            if (val) {
              url.searchParams.set('q', val)
            } else {
              url.searchParams.delete('q')
            }
            history.replaceState(null, '', url.toString())
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              clearSearch()
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          placeholder="Search all tools…"
          aria-label="Search tools"
          className={cn(
            'w-full rounded-xl border bg-bg-muted py-3 pl-10 pr-10',
            'text-sm text-fg placeholder:text-fg-subtle',
            'transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary',
            query
              ? 'border-primary bg-bg'
              : 'border-border focus-visible:border-primary'
          )}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-fg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Search results */}
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
                No tools match <strong className="text-fg">&ldquo;{query.trim()}&rdquo;</strong> — try a shorter search.
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

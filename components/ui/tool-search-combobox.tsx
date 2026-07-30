'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ALL_TOOLS } from '@/content/tool-catalog'
import { filterTools } from '@/lib/utils/filter-tools'
import { highlight } from '@/lib/utils/highlight'

const CATEGORY_LABELS: Record<string, string> = {
  images: 'Images',
  pdf: 'PDF',
  'video-audio': 'Video & Audio',
  developer: 'Developer',
  'web-tools': 'Web Tools',
  'ai-tools': 'AI Tools',
  'image-editing': 'Editing',
  'image-to-text': 'Image to Text',
}

interface ToolSearchComboboxProps {
  placeholder?: string
  onNavigate?: () => void
  autoFocus?: boolean
  className?: string
  value?: string
  onChange?: (value: string) => void
}

export function ToolSearchCombobox({
  placeholder = 'Search tools…',
  onNavigate,
  autoFocus,
  className,
  value: controlledValue,
  onChange: controlledOnChange,
}: ToolSearchComboboxProps) {
  const isControlled = controlledValue !== undefined
  const [internalQuery, setInternalQuery] = useState('')
  const query = isControlled ? controlledValue : internalQuery
  const setQuery = isControlled ? (controlledOnChange ?? (() => {})) : setInternalQuery

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const trimmed = query.trim().toLowerCase()
  const results = filterTools(ALL_TOOLS, trimmed)
  const showDropdown = open && trimmed.length > 0

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [trimmed])

  // Close on outside click
  useEffect(() => {
    if (!showDropdown) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDropdown])

  function navigate(slug: string) {
    router.push(`/${slug}`)
    setQuery('')
    setOpen(false)
    onNavigate?.()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) {
      if (e.key === 'Escape') {
        setQuery('')
        inputRef.current?.blur()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = activeIndex >= 0 ? results[activeIndex] : results[0]
      if (target) navigate(target.slug)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showDropdown && activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          autoFocus={autoFocus}
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            if (trimmed) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
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
            onMouseDown={(e) => {
              e.preventDefault() // prevent blur before click
              setQuery('')
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-fg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Tool suggestions"
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1',
            'max-h-72 overflow-y-auto rounded-xl border border-border bg-bg-elevated shadow-lg',
            'animate-in fade-in slide-in-from-top-1 duration-100'
          )}
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-fg-muted">
              No tools match &ldquo;{query.trim()}&rdquo;
            </li>
          ) : (
            results.map((tool, i) => (
              <li
                key={tool.slug}
                id={`${listboxId}-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault() // prevent input blur
                  navigate(tool.slug)
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between px-4 py-2.5',
                  'text-sm transition-colors',
                  i === activeIndex
                    ? 'bg-bg-muted text-fg'
                    : 'text-fg-muted hover:bg-bg-muted hover:text-fg'
                )}
              >
                <span className="font-medium">
                  {highlight(tool.title, trimmed)}
                </span>
                <span className="ml-4 shrink-0 text-xs text-fg-subtle">
                  {CATEGORY_LABELS[tool.category] ?? tool.category}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

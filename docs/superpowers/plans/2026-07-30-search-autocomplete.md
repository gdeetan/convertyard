# Search Autocomplete Dropdown — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Google-style autocomplete dropdown to the nav (desktop + mobile) and the `/tools` page search, driven by a shared `ToolSearchCombobox` component.

**Architecture:** A single `ToolSearchCombobox` component owns all filtering, dropdown rendering, and keyboard navigation. Filtering logic is extracted as a pure `filterTools()` function (testable). The nav gains a desktop expand-on-click search icon. The `/tools` page replaces its inline card-results input with the combobox while keeping the card grid below for browsing.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, `next/navigation` (`useRouter`), Vitest (unit tests for pure logic only)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/utils/highlight.tsx` | **Create** | `highlight(text, query)` helper — extracted from `tools-search.tsx` |
| `lib/utils/filter-tools.ts` | **Create** | `filterTools(tools, query, max?)` pure function + tests |
| `lib/utils/__tests__/filter-tools.test.ts` | **Create** | Unit tests for `filterTools` |
| `lib/utils/__tests__/highlight.test.tsx` | **Create** | Unit tests for `highlight` |
| `components/ui/tool-search-combobox.tsx` | **Create** | Shared combobox component |
| `components/tools-page/tools-search.tsx` | **Modify** | Replace input with `ToolSearchCombobox`; lift query state |
| `components/site-shell/nav.tsx` | **Modify** | Add desktop search icon + expansion; replace mobile search input |

---

## Task 1: Extract `highlight` helper

**Files:**
- Create: `lib/utils/highlight.tsx`
- Create: `lib/utils/__tests__/highlight.test.tsx`
- Modify: `components/tools-page/tools-search.tsx` (import from new location)

- [ ] **Step 1: Create `lib/utils/highlight.tsx`**

```tsx
import React from 'react'

export function highlight(text: string, query: string): React.ReactNode {
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
```

- [ ] **Step 2: Write failing tests**

Create `lib/utils/__tests__/highlight.test.tsx`:

```tsx
// @vitest-environment happy-dom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { highlight } from '../highlight'

describe('highlight', () => {
  it('returns plain string when query is empty', () => {
    expect(highlight('JPG to WebP', '')).toBe('JPG to WebP')
  })

  it('returns plain string when query not found', () => {
    expect(highlight('JPG to WebP', 'pdf')).toBe('JPG to WebP')
  })

  it('returns ReactNode with mark when query matches', () => {
    const result = highlight('JPG to WebP', 'webp')
    // Should be a React fragment — not a plain string
    expect(typeof result).toBe('object')
  })

  it('is case-insensitive', () => {
    const lower = highlight('JPG to WebP', 'webp')
    const upper = highlight('JPG to WebP', 'WEBP')
    // Both should return a ReactNode (not plain string)
    expect(typeof lower).toBe('object')
    expect(typeof upper).toBe('object')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run lib/utils/__tests__/highlight.test.tsx
```

Expected: FAIL — `highlight` not found (file doesn't exist yet, but step 1 creates it — so tests should actually pass after step 1. Run after step 1 to confirm they pass).

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run lib/utils/__tests__/highlight.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Update `tools-search.tsx` to import from new location**

In `components/tools-page/tools-search.tsx`, remove the local `highlight` function and add:

```tsx
import { highlight } from '@/lib/utils/highlight'
```

Delete lines 9–22 (the local `highlight` function definition).

- [ ] **Step 6: Verify the app still builds**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/utils/highlight.tsx lib/utils/__tests__/highlight.test.tsx components/tools-page/tools-search.tsx
git commit -m "refactor: extract highlight helper to lib/utils"
```

---

## Task 2: Create `filterTools` pure function

**Files:**
- Create: `lib/utils/filter-tools.ts`
- Create: `lib/utils/__tests__/filter-tools.test.ts`

- [ ] **Step 1: Create `lib/utils/filter-tools.ts`**

```ts
import type { CatalogTool } from '@/content/tool-catalog'

export function filterTools(
  tools: CatalogTool[],
  query: string,
  maxResults = 8,
): CatalogTool[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const titleMatches: CatalogTool[] = []
  const descriptionMatches: CatalogTool[] = []

  for (const tool of tools) {
    if (tool.status !== 'live') continue
    const inTitle = tool.title.toLowerCase().includes(q)
    const inDesc = tool.description.toLowerCase().includes(q)
    if (inTitle) {
      titleMatches.push(tool)
    } else if (inDesc) {
      descriptionMatches.push(tool)
    }
  }

  return [...titleMatches, ...descriptionMatches].slice(0, maxResults)
}
```

- [ ] **Step 2: Write failing tests**

Create `lib/utils/__tests__/filter-tools.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { filterTools } from '../filter-tools'
import type { CatalogTool } from '@/content/tool-catalog'

function makeTool(overrides: Partial<CatalogTool> & Pick<CatalogTool, 'slug' | 'title'>): CatalogTool {
  return {
    description: 'A test tool.',
    category: 'images',
    status: 'live',
    ...overrides,
  }
}

const TOOLS: CatalogTool[] = [
  makeTool({ slug: 'jpg-to-webp', title: 'JPG to WebP', description: 'Shrink JPGs without visible loss.' }),
  makeTool({ slug: 'png-to-webp', title: 'PNG to WebP', description: 'Smaller PNGs for the web.' }),
  makeTool({ slug: 'compress-pdf', title: 'Compress PDF', description: 'Shrink PDFs without destroying quality.' }),
  makeTool({ slug: 'coming-soon', title: 'Future Tool', description: 'WebP related coming soon.', status: 'coming-soon' }),
]

describe('filterTools', () => {
  it('returns empty array for empty query', () => {
    expect(filterTools(TOOLS, '')).toEqual([])
  })

  it('returns empty array for whitespace-only query', () => {
    expect(filterTools(TOOLS, '   ')).toEqual([])
  })

  it('matches on title (case-insensitive)', () => {
    const results = filterTools(TOOLS, 'WEBP')
    expect(results.map((t) => t.slug)).toContain('jpg-to-webp')
    expect(results.map((t) => t.slug)).toContain('png-to-webp')
  })

  it('excludes coming-soon tools', () => {
    const results = filterTools(TOOLS, 'webp')
    expect(results.map((t) => t.slug)).not.toContain('coming-soon')
  })

  it('matches on description when title does not match', () => {
    const results = filterTools(TOOLS, 'quality')
    expect(results.map((t) => t.slug)).toContain('compress-pdf')
  })

  it('ranks title matches above description matches', () => {
    const tools: CatalogTool[] = [
      makeTool({ slug: 'desc-match', title: 'Unrelated Tool', description: 'Works with WebP files.' }),
      makeTool({ slug: 'title-match', title: 'WebP Converter', description: 'Some description.' }),
    ]
    const results = filterTools(tools, 'webp')
    expect(results[0].slug).toBe('title-match')
  })

  it('respects maxResults cap', () => {
    const manyTools: CatalogTool[] = Array.from({ length: 20 }, (_, i) =>
      makeTool({ slug: `tool-${i}`, title: `WebP Tool ${i}` })
    )
    expect(filterTools(manyTools, 'webp', 5)).toHaveLength(5)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run lib/utils/__tests__/filter-tools.test.ts
```

Expected: FAIL — `filterTools` not found.

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run lib/utils/__tests__/filter-tools.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/filter-tools.ts lib/utils/__tests__/filter-tools.test.ts
git commit -m "feat: add filterTools pure function with tests"
```

---

## Task 3: Build `ToolSearchCombobox` component

**Files:**
- Create: `components/ui/tool-search-combobox.tsx`

This component handles the search input, dropdown panel, keyboard navigation, and navigation on select. It uses `filterTools` and `highlight` internally.

- [ ] **Step 1: Create `components/ui/tool-search-combobox.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/tool-search-combobox.tsx
git commit -m "feat: add ToolSearchCombobox shared component"
```

---

## Task 4: Upgrade `/tools` page search

**Files:**
- Modify: `components/tools-page/tools-search.tsx`

The existing component keeps the card grid. We replace only the `<input>` with `<ToolSearchCombobox>` and lift query to a shared state so both the combobox and the grid read from it.

- [ ] **Step 1: Rewrite `components/tools-page/tools-search.tsx`**

Replace the entire file content with:

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/tools-page/tools-search.tsx
git commit -m "feat: upgrade /tools page search with autocomplete dropdown"
```

---

## Task 5: Add desktop nav search icon + expansion

**Files:**
- Modify: `components/site-shell/nav.tsx`

Add `searchOpen` state. When false: show a `<Search>` icon button. When true: show the `ToolSearchCombobox` with `autoFocus`. Click-outside closes it.

- [ ] **Step 1: Add imports to `nav.tsx`**

At the top of `components/site-shell/nav.tsx`, add to the existing imports:

```tsx
import { ToolSearchCombobox } from '@/components/ui/tool-search-combobox'
```

And add `useRef` to the existing React import if not already there (it is — confirmed in current file).

- [ ] **Step 2: Add `searchOpen` state and ref inside `Nav()`**

In the `Nav` function body, after the existing state declarations (around line 130), add:

```tsx
const [searchOpen, setSearchOpen] = useState(false)
const searchContainerRef = useRef<HTMLDivElement>(null)
```

- [ ] **Step 3: Add click-outside handler for desktop search**

After the existing `useEffect` hooks inside `Nav`, add:

```tsx
// Close desktop search on outside click
useEffect(() => {
  if (!searchOpen) return
  function handleClick(e: MouseEvent) {
    if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
      setSearchOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClick)
  return () => document.removeEventListener('mousedown', handleClick)
}, [searchOpen])
```

- [ ] **Step 4: Add search icon + combobox to desktop nav**

In the desktop `<nav>` element, find the "Local-first badge" `<div>` (around line 336). Insert the following **before** that div:

```tsx
{/* Desktop search */}
<div ref={searchContainerRef} className="relative">
  {searchOpen ? (
    <ToolSearchCombobox
      placeholder="Search tools…"
      autoFocus
      className="w-72"
      onNavigate={() => setSearchOpen(false)}
    />
  ) : (
    <button
      type="button"
      aria-label="Search tools"
      onClick={() => setSearchOpen(true)}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-md',
        'text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
      )}
    >
      <Search className="h-4 w-4" aria-hidden="true" />
    </button>
  )}
</div>
```

- [ ] **Step 5: Update ESC handler to also close desktop search**

Find the existing ESC `useEffect` in `Nav` (around line 145). Update it:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (mobileOpen) closeMobileMenu()
      if (megaOpen) setMegaOpen(false)
      if (searchOpen) setSearchOpen(false)
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [mobileOpen, megaOpen, searchOpen, closeMobileMenu])
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/site-shell/nav.tsx
git commit -m "feat: add expandable search to desktop nav"
```

---

## Task 6: Upgrade mobile nav search

**Files:**
- Modify: `components/site-shell/nav.tsx`

Replace the existing mobile search `<input>` (around line 413–436) with `<ToolSearchCombobox>`.

- [ ] **Step 1: Replace mobile search input in `nav.tsx`**

Find the mobile menu "Search" section (inside the scrollable `<div className="flex-1 overflow-y-auto...">`, around line 413):

```tsx
{/* Search */}
<div className="relative mb-6">
  <Search
    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
    aria-hidden="true"
  />
  <input
    type="search"
    placeholder="Search tools…"
    aria-label="Search tools"
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        const val = (e.currentTarget as HTMLInputElement).value.trim()
        if (val) {
          closeMobileMenu()
          window.location.href = `/?q=${encodeURIComponent(val)}#tools`
        }
      }
    }}
    className={cn(
      'w-full rounded-lg border border-border bg-bg-muted py-3 pl-9 pr-4',
      'text-sm text-fg placeholder:text-fg-subtle',
      'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary focus-visible:border-primary'
    )}
  />
</div>
```

Replace that entire block with:

```tsx
{/* Search */}
<div className="mb-6">
  <ToolSearchCombobox
    placeholder="Search tools…"
    onNavigate={closeMobileMenu}
  />
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests to confirm nothing broke**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add components/site-shell/nav.tsx
git commit -m "feat: upgrade mobile nav search with autocomplete dropdown"
```

---

## Task 7: Manual smoke test

Before declaring done, test the following manually in the browser (`npm run dev`):

- [ ] **Desktop nav:** Click the search icon → input appears focused. Type "pdf" → dropdown shows PDF tools. Arrow keys navigate. Enter navigates to the tool. Escape closes the bar.
- [ ] **Desktop nav click-outside:** Open search, click elsewhere → search closes.
- [ ] **Mobile nav:** Open hamburger → type in search → dropdown appears. Tap a result → navigates and closes the mobile menu.
- [ ] **`/tools` page:** Type in search bar → dropdown appears above the card grid. Click a result → navigates. Card grid still filters below as you type.
- [ ] **Empty state:** Type "xyzabc" in any search → dropdown shows "No tools match…".
- [ ] **Keyboard only:** Tab to search icon (desktop) → Enter to open → type → Arrow to result → Enter → navigates.

- [ ] **Final commit (if any fixes needed from smoke test)**

```bash
git add -p
git commit -m "fix: search autocomplete smoke test fixes"
```

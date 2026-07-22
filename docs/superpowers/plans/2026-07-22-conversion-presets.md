# Conversion Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users save and reapply named sets of tool options (presets) per tool, stored in localStorage, with a UI above the options panel.

**Architecture:** A pure-logic storage layer (`lib/hooks/use-user-presets.ts`) is the only new abstraction — it exposes a hook that reads/writes to localStorage keyed by tool slug. A new `UserPresetBar` component consumes the hook and renders above `<OptionsPanel>`. `ToolShell` renders `UserPresetBar` when `config.enablePresets` is true. No existing tool is affected unless explicitly opted in.

**Tech Stack:** TypeScript, React (useState, useCallback), localStorage, Vitest, Tailwind CSS, lucide-react

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/types.ts` | Modify (line 171) | Add `enablePresets?: true` to `ToolConfig` |
| `lib/hooks/use-user-presets.ts` | Create | Storage logic + React hook |
| `lib/hooks/__tests__/use-user-presets.test.ts` | Create | Unit tests for storage logic |
| `components/tool-shell/user-preset-bar.tsx` | Create | UI: chip row + save flow |
| `components/tool-shell/tool-shell.tsx` | Modify | Wire `UserPresetBar` above `OptionsPanel` |

---

## Task 1: Add `enablePresets` to `ToolConfig`

**Files:**
- Modify: `lib/types.ts:171`

- [ ] **Step 1: Add the field**

Open `lib/types.ts`. Find line 171 (the `presetBar` field). Add `enablePresets` directly after it:

```ts
  presetBar?: React.ComponentType<{ onApply: (values: ToolOptions) => void }>
  enablePresets?: true
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add enablePresets flag to ToolConfig"
```

---

## Task 2: Storage layer + hook

**Files:**
- Create: `lib/hooks/use-user-presets.ts`
- Create: `lib/hooks/__tests__/use-user-presets.test.ts`

The hook is split into two layers so the pure logic can be tested without React infrastructure:
1. **Pure functions** (`readPresets`, `writePresets`, `addPreset`, `removePreset`) — testable with plain Vitest
2. **React hook** (`useUserPresets`) — thin wrapper calling those functions with `useState`

- [ ] **Step 1: Write the failing tests**

Create `lib/hooks/__tests__/use-user-presets.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import {
  readPresets,
  addPreset,
  removePreset,
  PRESETS_KEY,
  MAX_PRESETS,
} from '../use-user-presets'
import type { SavedPreset } from '../use-user-presets'

const SLUG = 'pdf-to-jpg'
const KEY = PRESETS_KEY(SLUG)

function makePreset(name: string, overrides: Partial<SavedPreset> = {}): SavedPreset {
  return {
    id: crypto.randomUUID(),
    name,
    values: { quality: 85, dpi: 300 },
    savedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('readPresets', () => {
  it('returns empty array when nothing stored', () => {
    expect(readPresets(SLUG)).toEqual([])
  })

  it('returns stored presets', () => {
    const preset = makePreset('Client work')
    localStorage.setItem(KEY, JSON.stringify([preset]))
    expect(readPresets(SLUG)).toEqual([preset])
  })

  it('returns empty array on corrupt JSON', () => {
    localStorage.setItem(KEY, 'not-json')
    expect(readPresets(SLUG)).toEqual([])
  })
})

describe('addPreset', () => {
  it('adds preset to front of list', () => {
    const existing = makePreset('Old preset')
    localStorage.setItem(KEY, JSON.stringify([existing]))

    const next = addPreset(SLUG, 'New preset', { quality: 70 })
    expect(next[0].name).toBe('New preset')
    expect(next[0].values).toEqual({ quality: 70 })
    expect(next[1]).toEqual(existing)
  })

  it('trims list to MAX_PRESETS', () => {
    const existing = Array.from({ length: MAX_PRESETS }, (_, i) =>
      makePreset(`Preset ${i}`)
    )
    localStorage.setItem(KEY, JSON.stringify(existing))

    const next = addPreset(SLUG, 'New', { quality: 80 })
    expect(next).toHaveLength(MAX_PRESETS)
    expect(next[0].name).toBe('New')
  })

  it('strips File values before saving', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const next = addPreset(SLUG, 'Has file', { quality: 80, watermark: file })
    expect(next[0].values).toEqual({ quality: 80 })
    expect(next[0].values.watermark).toBeUndefined()
  })

  it('strips null values from image-upload fields', () => {
    const next = addPreset(SLUG, 'Null upload', { quality: 80, watermark: null })
    expect(next[0].values).toEqual({ quality: 80 })
  })

  it('persists to localStorage', () => {
    addPreset(SLUG, 'Persisted', { quality: 90 })
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    expect(stored[0].name).toBe('Persisted')
  })

  it('trims name to 40 chars', () => {
    const longName = 'A'.repeat(60)
    const next = addPreset(SLUG, longName, {})
    expect(next[0].name).toHaveLength(40)
  })
})

describe('removePreset', () => {
  it('removes preset by id', () => {
    const a = makePreset('Keep')
    const b = makePreset('Remove')
    localStorage.setItem(KEY, JSON.stringify([a, b]))

    const next = removePreset(SLUG, b.id)
    expect(next).toHaveLength(1)
    expect(next[0].name).toBe('Keep')
  })

  it('persists removal to localStorage', () => {
    const a = makePreset('Keep')
    const b = makePreset('Remove')
    localStorage.setItem(KEY, JSON.stringify([a, b]))

    removePreset(SLUG, b.id)
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Keep')
  })

  it('no-ops if id not found', () => {
    const a = makePreset('Keep')
    localStorage.setItem(KEY, JSON.stringify([a]))
    const next = removePreset(SLUG, 'nonexistent-id')
    expect(next).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/hooks/__tests__/use-user-presets.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the hook**

Create `lib/hooks/use-user-presets.ts`:

```ts
'use client'

import { useState, useCallback } from 'react'
import type { ToolOptions } from '@/lib/types'

export interface SavedPreset {
  id: string
  name: string
  values: ToolOptions
  savedAt: number
}

export const MAX_PRESETS = 5
export const PRESETS_KEY = (slug: string) => `cy-presets-v1:${slug}`

function isSerializable(value: unknown): boolean {
  return !(value instanceof File) && value !== null
}

function stripFiles(values: ToolOptions): ToolOptions {
  return Object.fromEntries(
    Object.entries(values).filter(([, v]) => isSerializable(v))
  )
}

export function readPresets(slug: string): SavedPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY(slug))
    if (!raw) return []
    return JSON.parse(raw) as SavedPreset[]
  } catch {
    return []
  }
}

export function addPreset(slug: string, name: string, values: ToolOptions): SavedPreset[] {
  const preset: SavedPreset = {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 40),
    values: stripFiles(values),
    savedAt: Date.now(),
  }
  const existing = readPresets(slug)
  const next = [preset, ...existing].slice(0, MAX_PRESETS)
  try {
    localStorage.setItem(PRESETS_KEY(slug), JSON.stringify(next))
  } catch {
    // silent — private browsing or quota exceeded
  }
  return next
}

export function removePreset(slug: string, id: string): SavedPreset[] {
  const next = readPresets(slug).filter((p) => p.id !== id)
  try {
    localStorage.setItem(PRESETS_KEY(slug), JSON.stringify(next))
  } catch {
    // silent
  }
  return next
}

export function useUserPresets(slug: string) {
  const [presets, setPresets] = useState<SavedPreset[]>(() => readPresets(slug))

  const save = useCallback(
    (name: string, values: ToolOptions) => {
      setPresets(addPreset(slug, name, values))
    },
    [slug]
  )

  const remove = useCallback(
    (id: string) => {
      setPresets(removePreset(slug, id))
    },
    [slug]
  )

  return { presets, save, remove }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/hooks/__tests__/use-user-presets.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/hooks/use-user-presets.ts lib/hooks/__tests__/use-user-presets.test.ts
git commit -m "feat: useUserPresets hook with localStorage persistence"
```

---

## Task 3: `UserPresetBar` component

**Files:**
- Create: `components/tool-shell/user-preset-bar.tsx`

- [ ] **Step 1: Create the component**

Create `components/tool-shell/user-preset-bar.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, BookmarkPlus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUserPresets, MAX_PRESETS } from '@/lib/hooks/use-user-presets'
import type { ToolOptions } from '@/lib/types'

interface UserPresetBarProps {
  slug: string
  currentValues: ToolOptions
  onApply: (values: ToolOptions) => void
}

export function UserPresetBar({ slug, currentValues, onApply }: UserPresetBarProps) {
  const { presets, save, remove } = useUserPresets(slug)
  const [saving, setSaving] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (saving) inputRef.current?.focus()
  }, [saving])

  const handleSaveConfirm = useCallback(() => {
    const name = inputValue.trim()
    if (!name) return
    save(name, currentValues)
    setInputValue('')
    setSaving(false)
  }, [inputValue, currentValues, save])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSaveConfirm()
      if (e.key === 'Escape') {
        setInputValue('')
        setSaving(false)
      }
    },
    [handleSaveConfirm]
  )

  const atCap = presets.length >= MAX_PRESETS

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-muted px-3 py-2">
      <span className="text-xs font-medium text-fg-muted shrink-0">My presets:</span>

      {presets.length === 0 && !saving && (
        <span className="text-xs text-fg-subtle">No saved presets yet.</span>
      )}

      {presets.map((preset) => (
        <span
          key={preset.id}
          className="flex items-center gap-1 rounded-full border border-border bg-bg-elevated pl-3 pr-1.5 py-1"
        >
          <button
            type="button"
            onClick={() => onApply(preset.values)}
            className={cn(
              'text-xs font-medium text-fg',
              'hover:text-primary transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
            )}
          >
            {preset.name}
          </button>
          <button
            type="button"
            onClick={() => remove(preset.id)}
            aria-label={`Delete preset "${preset.name}"`}
            className={cn(
              'rounded-full p-0.5 text-fg-subtle transition-colors',
              'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}

      {saving ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
            placeholder="Preset name…"
            className={cn(
              'rounded-md border border-primary bg-bg-elevated px-2.5 py-1 text-xs text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              'w-40'
            )}
          />
          <button
            type="button"
            onClick={handleSaveConfirm}
            disabled={!inputValue.trim()}
            className={cn(
              'rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-fg',
              'transition-colors hover:bg-primary-hover',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setInputValue(''); setSaving(false) }}
            className="text-xs text-fg-muted hover:text-fg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
          >
            Cancel
          </button>
        </div>
      ) : atCap ? (
        <span className="text-xs text-fg-subtle">5/5 — delete one to save more</span>
      ) : (
        <button
          type="button"
          onClick={() => setSaving(true)}
          className={cn(
            'flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1',
            'text-xs text-fg-muted transition-colors',
            'hover:border-primary/50 hover:text-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
        >
          <BookmarkPlus className="h-3 w-3" aria-hidden="true" />
          Save current
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/tool-shell/user-preset-bar.tsx
git commit -m "feat: UserPresetBar component"
```

---

## Task 4: Wire `UserPresetBar` into `ToolShell`

**Files:**
- Modify: `components/tool-shell/tool-shell.tsx`

- [ ] **Step 1: Add import**

Open `components/tool-shell/tool-shell.tsx`. Find the import block at the top. Add after the `OptionsPanel` import (around line 9):

```ts
import { UserPresetBar } from './user-preset-bar'
```

- [ ] **Step 2: Add the preset bar block**

In the "Idle: files present" section, find the block that renders `config.options` (around line 345):

```tsx
{config.options && config.options.length > 0 && (
  <OptionsPanel
    options={config.options}
    values={options}
    onChange={handleOptionChange}
  />
)}
```

Add `UserPresetBar` directly **above** that block:

```tsx
{config.enablePresets && (config.options?.length ?? 0) > 0 && (
  <UserPresetBar
    slug={config.slug}
    currentValues={options}
    onApply={handlePresetApply}
  />
)}

{config.options && config.options.length > 0 && (
  <OptionsPanel
    options={config.options}
    values={options}
    onChange={handleOptionChange}
  />
)}
```

`handlePresetApply` already exists in `ToolShell` (line ~177) — no new function needed.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all unit tests to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/tool-shell/tool-shell.tsx
git commit -m "feat: wire UserPresetBar into ToolShell"
```

---

## Task 5: Enable presets on pdf-to-jpg

**Files:**
- Modify: whichever file in `content/tools/` defines the `pdf-to-jpg` tool config

- [ ] **Step 1: Find the tool config file**

```bash
grep -rl 'pdf-to-jpg\|pdfToJpg' /Users/garrickdeetan/Documents/Covertyard/content/tools/ | head -5
```

Open the file that defines the `ToolConfig` object for this tool.

- [ ] **Step 2: Add `enablePresets: true`**

Find the `ToolConfig` object. Add `enablePresets: true` after the `options` field:

```ts
  options: [
    // ... existing options ...
  ],
  enablePresets: true,
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the dev server and manually verify**

```bash
npm run dev
```

Navigate to `http://localhost:3000/pdf-to-jpg`. Add a file. You should see the "My presets" bar above the options panel with a "Save current" button. Save a preset, verify it appears as a chip. Click the chip to apply. Click × to delete. Try saving 5 presets — verify the cap UI shows. Reload the page — saved presets should persist.

- [ ] **Step 5: Commit**

```bash
git add content/tools/  # add only the modified tool file
git commit -m "feat: enable user presets on pdf-to-jpg"
```

---

## Self-Review

**Spec coverage:**
- ✅ Per-tool presets keyed by slug
- ✅ Free-text name, trimmed, max 40 chars
- ✅ Cap at 5, delete by × (no confirmation)
- ✅ Above options panel
- ✅ Opt-in via `enablePresets: true`
- ✅ `image-upload` (File/null) values excluded from save
- ✅ localStorage errors silently no-op
- ✅ Merge apply (`{ ...prev, ...preset.values }`) — options not in preset keep current value
- ✅ At-cap message: "5/5 — delete one to save more"
- ✅ No existing tools affected

**Placeholder scan:** None found.

**Type consistency:**
- `SavedPreset` exported from `use-user-presets.ts`, imported in component — consistent
- `PRESETS_KEY`, `MAX_PRESETS`, `readPresets`, `addPreset`, `removePreset` all exported from hook file, imported in tests — consistent
- `ToolOptions` used throughout — consistent with existing codebase type

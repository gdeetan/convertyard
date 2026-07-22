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

'use client'

import { useState, useRef } from 'react'
import type { WordChunk } from '@/lib/converters/caption-types'
import {
  splitWord,
  mergeWordWithNext,
  insertWordAfter,
  setWordTiming,
  nudgeWord,
} from '@/lib/converters/caption-edit'

interface Props {
  words: WordChunk[]
  activeIndex: number
  onChange: (words: WordChunk[]) => void
  onSeek?: (time: number) => void
}

function fmt(sec: number): string {
  return Math.max(0, sec).toFixed(2)
}

export function CaptionEditor({ words, activeIndex, onChange, onSeek }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = words[activeIndex]

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setDraft(words[idx].text)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitEdit(idx: number) {
    if (draft.trim() === '') {
      onChange(words.filter((_, i) => i !== idx))
    } else {
      const next = [...words]
      next[idx] = { ...next[idx], text: draft.trim() }
      onChange(next)
    }
    setEditingIdx(null)
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Enter') commitEdit(idx)
    if (e.key === 'Escape') setEditingIdx(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fg">Transcript</p>
        <p className="text-xs text-fg-muted">Click to jump. Double-click to edit text. Empty = delete.</p>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap gap-1">
          {words.map((word, idx) => (
            <span key={`${idx}-${word.start}`}>
              {editingIdx === idx ? (
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitEdit(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-20 rounded border border-primary bg-bg px-1 py-0.5 text-sm text-fg outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSeek?.(word.start)}
                  onDoubleClick={() => startEdit(idx)}
                  className={`rounded px-1 py-0.5 text-sm transition-colors ${
                    idx === activeIndex
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-fg hover:bg-bg-elevated'
                  }`}
                >
                  {word.text}
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-bg p-3">
          <div>
            <label className="block text-[11px] text-fg-muted" htmlFor="cap-start">Start</label>
            <input
              id="cap-start"
              type="number"
              step="0.05"
              min="0"
              value={fmt(selected.start)}
              onChange={(e) => onChange(setWordTiming(words, activeIndex, Number(e.target.value), selected.end))}
              className="w-20 rounded border border-border bg-bg px-2 py-1 text-sm text-fg"
            />
          </div>
          <div>
            <label className="block text-[11px] text-fg-muted" htmlFor="cap-end">End</label>
            <input
              id="cap-end"
              type="number"
              step="0.05"
              min="0"
              value={fmt(selected.end)}
              onChange={(e) => onChange(setWordTiming(words, activeIndex, selected.start, Number(e.target.value)))}
              className="w-20 rounded border border-border bg-bg px-2 py-1 text-sm text-fg"
            />
          </div>
          <button type="button" onClick={() => onChange(nudgeWord(words, activeIndex, -0.1))} className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-bg-muted">
            −0.1s
          </button>
          <button type="button" onClick={() => onChange(nudgeWord(words, activeIndex, 0.1))} className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-bg-muted">
            +0.1s
          </button>
          <button type="button" onClick={() => onChange(splitWord(words, activeIndex))} className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-bg-muted">
            Split
          </button>
          <button
            type="button"
            onClick={() => onChange(mergeWordWithNext(words, activeIndex))}
            disabled={activeIndex >= words.length - 1}
            className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-bg-muted disabled:opacity-40"
          >
            Merge next
          </button>
          <button type="button" onClick={() => onChange(insertWordAfter(words, activeIndex))} className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-bg-muted">
            Insert after
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import type { WordChunk } from '@/lib/converters/caption-types'

interface Props {
  words: WordChunk[]
  activeIndex: number
  onChange: (words: WordChunk[]) => void
  onSeek?: (time: number) => void
}

export function CaptionEditor({ words, activeIndex, onChange, onSeek }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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
        <p className="text-xs text-fg-muted">Click a word to jump. Double-click to edit. Empty = delete.</p>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap gap-1">
          {words.map((word, idx) => (
            <span key={idx}>
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
    </div>
  )
}

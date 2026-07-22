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

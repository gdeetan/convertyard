// @vitest-environment happy-dom
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

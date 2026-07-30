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

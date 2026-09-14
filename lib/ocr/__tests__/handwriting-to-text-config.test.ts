import { describe, expect, it } from 'vitest'
import { config } from '@/content/tools/handwriting-to-text'

describe('handwriting-to-text options', () => {
  it('does not expose a Standard vs AI-Enhanced engine toggle', () => {
    const names = config.options.map(opt => opt.name)
    expect(names).not.toContain('recognitionEngine')
  })
})

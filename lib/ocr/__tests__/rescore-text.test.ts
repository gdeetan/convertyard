import { describe, expect, it } from 'vitest'
import { rescoreOcrText } from '../rescore-text'

describe('rescoreOcrText', () => {
  it('merges split grateful and greeting on a handwriting page', () => {
    const input = `Hey Credit!
This is my normal handwriting. I've
gotten a lot of comments about it over the
years which I am grave ful for. but don't
always understand the compilinets as I
feel my writing is sort of a lazy half-
print, half- cuisine.`
    const out = rescoreOcrText(input)
    expect(out).toContain('Hey Reddit!')
    expect(out).toContain('grateful')
    expect(out).not.toContain('grave ful')
    expect(out).toContain('compliments')
    expect(out).toContain('half-cursive')
  })

  it('does not change Credit on a non-handwriting page', () => {
    expect(rescoreOcrText('Hey Credit! Please pay the invoice.')).toContain('Hey Credit!')
  })
})

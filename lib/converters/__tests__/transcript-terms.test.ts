import { describe, expect, it } from 'vitest'
import {
  applyTranscriptGlossary,
  applyTranscriptGlossaryToSrt,
  applyVocabToTranscriptionResult,
  buildWhisperVocabPrompt,
  encodeWhisperVocabPromptIds,
  hasTranscriptTermsOverflow,
  mergeWhisperDecoderInputIds,
  parseTranscriptTerms,
  stripVocabPromptLeak,
} from '@/lib/converters/transcript-terms'

describe('parseTranscriptTerms', () => {
  it('splits on commas and newlines, not spaces', () => {
    expect(parseTranscriptTerms('ConvertYard, Garrick\nWeb Assembly')).toEqual([
      'ConvertYard',
      'Garrick',
      'Web Assembly',
    ])
  })

  it('trims, drops empty and short terms, and de-dupes case-insensitively', () => {
    expect(parseTranscriptTerms('  AI, OK, ConvertYard, convertyard, ,  Hi ')).toEqual([
      'ConvertYard',
    ])
  })

  it('returns empty for blank input', () => {
    expect(parseTranscriptTerms('')).toEqual([])
    expect(parseTranscriptTerms('  \n  ')).toEqual([])
  })

  it('keeps the first 40 terms', () => {
    const input = Array.from({ length: 45 }, (_, i) => `Term${String(i).padStart(2, '0')}`).join(', ')
    const terms = parseTranscriptTerms(input)
    expect(terms).toHaveLength(40)
    expect(terms[0]).toBe('Term00')
    expect(terms[39]).toBe('Term39')
    expect(hasTranscriptTermsOverflow(input)).toBe(true)
    expect(hasTranscriptTermsOverflow('ConvertYard, Garrick')).toBe(false)
  })
})

describe('buildWhisperVocabPrompt', () => {
  it('joins terms with a trailing period', () => {
    expect(buildWhisperVocabPrompt(['ConvertYard', 'Garrick', 'WebAssembly'])).toBe(
      'ConvertYard, Garrick, WebAssembly.',
    )
  })

  it('returns empty when there are no terms', () => {
    expect(buildWhisperVocabPrompt([])).toBe('')
  })

  it('truncates at a term boundary to stay within 180 characters', () => {
    const terms = Array.from({ length: 20 }, (_, i) => `LongishName${i}XXXX`)
    const prompt = buildWhisperVocabPrompt(terms)
    expect(prompt.endsWith('.')).toBe(true)
    expect(prompt.length).toBeLessThanOrEqual(180)
    expect(prompt.includes('LongishName0XXXX')).toBe(true)
    expect(prompt.endsWith('LongishName19XXXX.')).toBe(false)
  })

  it('hard-cuts a single oversized term', () => {
    const term = 'A'.repeat(200)
    const prompt = buildWhisperVocabPrompt([term])
    expect(prompt.length).toBe(180)
    expect(prompt.endsWith('.')).toBe(true)
  })
})

describe('applyTranscriptGlossary', () => {
  it('replaces case-insensitively with the user spelling and prefers the longest term', () => {
    expect(applyTranscriptGlossary('i use convertyard and convert tools', ['ConvertYard', 'Convert']))
      .toBe('i use ConvertYard and Convert tools')
  })

  it('skips a span that already matches exactly', () => {
    expect(applyTranscriptGlossary('ConvertYard shipped', ['ConvertYard'])).toBe('ConvertYard shipped')
  })

  it('replaces a multi-word phrase', () => {
    expect(applyTranscriptGlossary('we use web assembly in the browser', ['Web Assembly']))
      .toBe('we use Web Assembly in the browser')
  })

  it('escapes regex metacharacters', () => {
    expect(applyTranscriptGlossary('wrote c++ code', ['C++'])).toBe('wrote C++ code')
  })
})

describe('applyTranscriptGlossaryToSrt', () => {
  it('rewrites cue text only', () => {
    const srt = '1\n00:00:00,000 --> 00:00:01,250\nhello convertyard\n'
    expect(applyTranscriptGlossaryToSrt(srt, ['ConvertYard'])).toBe(
      '1\n00:00:00,000 --> 00:00:01,250\nhello ConvertYard\n',
    )
  })
})

describe('stripVocabPromptLeak', () => {
  it('strips the prompt prefix once and keeps a later mention', () => {
    const prompt = 'ConvertYard, Garrick.'
    const text = 'ConvertYard, Garrick. We built ConvertYard later.'
    expect(stripVocabPromptLeak(text, prompt)).toBe('We built ConvertYard later.')
  })

  it('strips a Vocabulary: prefix plus the comma-joined list', () => {
    expect(stripVocabPromptLeak('Vocabulary: ConvertYard, Garrick We met.', 'ConvertYard, Garrick.'))
      .toBe('We met.')
  })
})

describe('applyVocabToTranscriptionResult', () => {
  it('strips leak then glosses text and chunks', () => {
    const out = applyVocabToTranscriptionResult(
      {
        text: 'ConvertYard, Garrick. hello convertyard',
        chunks: [
          { text: 'ConvertYard, Garrick. hello convertyard', timestamp: [0, 1] },
        ],
      },
      'ConvertYard, Garrick.',
      ['ConvertYard', 'Garrick'],
    )
    expect(out.text).toBe('hello ConvertYard')
    expect(out.chunks?.[0].text).toBe('hello ConvertYard')
  })
})

describe('encodeWhisperVocabPromptIds', () => {
  it('encodes startofprev plus prompt and drops a leading BOS', () => {
    const tokenizer = {
      bos_token_id: 1,
      encode: (text: string) => [1, 99, ...text.split('').map((c) => c.charCodeAt(0))],
    }
    const ids = encodeWhisperVocabPromptIds(tokenizer, 'Hi.')
    expect(ids[0]).toBe(99)
    expect(ids.length).toBeLessThanOrEqual(100)
  })
})

describe('mergeWhisperDecoderInputIds', () => {
  it('prepends prompt ids onto decoder start tokens', () => {
    expect(mergeWhisperDecoderInputIds([10, 11], [50258, 50259])).toEqual([10, 11, 50258, 50259])
  })
})

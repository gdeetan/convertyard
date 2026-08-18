# Follow Caption Timing + Active-Word Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift Whisper word timestamps 120 ms earlier so Follow highlights land with the voice, add Shift-all ±0.1s, and draw the Follow active word at 112% size in preview and burn.

**Architecture:** Apply a lead helper to Whisper output only (not SRT import). Mutate the same `WordChunk[]` for preview, editor, and ASS. Follow scale is a single constant used by canvas draw and karaoke overlay tags.

**Tech Stack:** Existing caption modules (`caption-words`, `caption-edit`, `caption-draw`, `caption-ass-builder`), Vitest, React + Tailwind.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `lib/converters/caption-words.ts` | `WHISPER_WORD_LEAD_SEC`, `applyWhisperWordLead` |
| Modify | `lib/converters/caption-transcribe.ts` | Apply lead after `wordsFromTranscription` |
| Modify | `lib/converters/caption-edit.ts` | `nudgeAllWords` |
| Modify | `lib/converters/caption-layout.ts` | `FOLLOW_ACTIVE_WORD_SCALE` |
| Modify | `lib/converters/caption-ass-builder.ts` | Karaoke overlay `\fscx112\fscy112` |
| Modify | `lib/converters/caption-draw.ts` | Scaled canvas font for active Follow word |
| Modify | `components/caption-tool/CaptionEditor.tsx` | Shift all −0.1s / +0.1s |
| Modify | `lib/converters/__tests__/caption-words.test.ts` | Lead / clamp / skip estimated |
| Modify | `lib/converters/__tests__/caption-edit.test.ts` | Nudge-all + clamp |
| Modify | `lib/converters/__tests__/caption-ass-builder.test.ts` | Karaoke scale tags |
| Modify | `lib/converters/__tests__/caption-layout.test.ts` | Scale constant |

---

### Task 1: Whisper word lead helper

**Files:**
- Modify: `lib/converters/__tests__/caption-words.test.ts`
- Modify: `lib/converters/caption-words.ts`
- Modify: `lib/converters/caption-transcribe.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/converters/__tests__/caption-words.test.ts`:

```ts
import { looksLikeSegments, wordsFromTranscription, applyWhisperWordLead, WHISPER_WORD_LEAD_SEC } from '../caption-words'

describe('applyWhisperWordLead', () => {
  it('is 120 ms', () => {
    expect(WHISPER_WORD_LEAD_SEC).toBe(0.12)
  })

  it('shifts real timings earlier by 120 ms', () => {
    const out = applyWhisperWordLead({
      timestampsEstimated: false,
      words: [
        { text: 'Hello', start: 0.5, end: 0.8 },
        { text: 'world', start: 0.8, end: 1.2 },
      ],
    })
    expect(out.words).toEqual([
      { text: 'Hello', start: 0.38, end: 0.68 },
      { text: 'world', start: 0.68, end: 1.08 },
    ])
  })

  it('clamps start to 0 and keeps a 0.05 s minimum span', () => {
    const out = applyWhisperWordLead({
      timestampsEstimated: false,
      words: [{ text: 'Hi', start: 0.05, end: 0.2 }],
    })
    expect(out.words[0].start).toBe(0)
    expect(out.words[0].end).toBeCloseTo(0.08)
  })

  it('does not change estimated or zero-span transcripts', () => {
    const estimated = {
      timestampsEstimated: true,
      words: [
        { text: 'Hello', start: 0, end: 0 },
        { text: 'world', start: 0, end: 0 },
      ],
    }
    expect(applyWhisperWordLead(estimated)).toEqual(estimated)

    const zeros = {
      timestampsEstimated: false,
      words: [{ text: 'Hello', start: 0, end: 0 }],
    }
    expect(applyWhisperWordLead(zeros)).toEqual(zeros)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/converters/__tests__/caption-words.test.ts`

Expected: FAIL — `applyWhisperWordLead` / `WHISPER_WORD_LEAD_SEC` are not exported.

- [ ] **Step 3: Implement the helper**

Add to `lib/converters/caption-words.ts` (after the `CaptionTranscript` interface):

```ts
export const WHISPER_WORD_LEAD_SEC = 0.12
const MIN_WORD_SPAN_SEC = 0.05

/** Shift Whisper word stamps earlier. Skip estimated / all-zero timings. */
export function applyWhisperWordLead(
  transcript: CaptionTranscript,
  leadSec = WHISPER_WORD_LEAD_SEC,
): CaptionTranscript {
  if (transcript.timestampsEstimated) return transcript
  if (!transcript.words.some((w) => w.end > 0)) return transcript
  return {
    ...transcript,
    words: transcript.words.map((w) => {
      const start = Math.max(0, w.start - leadSec)
      return { ...w, start, end: Math.max(start + MIN_WORD_SPAN_SEC, w.end - leadSec) }
    }),
  }
}
```

Leave `wordsFromTranscription` unchanged. Import path does not call this helper.

- [ ] **Step 4: Apply lead in `transcribeToWords`**

In `lib/converters/caption-transcribe.ts`, change the import:

```ts
import { applyWhisperWordLead, wordsFromTranscription, type CaptionTranscript } from './caption-words'
```

Change the return at the end of `transcribeToWords` from:

```ts
  return wordsFromTranscription({ text: textParts.join(' '), chunks: merged })
```

to:

```ts
  return applyWhisperWordLead(wordsFromTranscription({ text: textParts.join(' '), chunks: merged }))
```

`handleImportFile` in `CaptionTool.tsx` must stay on `parseSubtitleText` only — do not call `applyWhisperWordLead` there.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/converters/__tests__/caption-words.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/converters/caption-words.ts lib/converters/caption-transcribe.ts lib/converters/__tests__/caption-words.test.ts
git commit -m "fix(captions): pull Whisper word stamps 120ms earlier"
```

---

### Task 2: Shift all words

**Files:**
- Modify: `lib/converters/__tests__/caption-edit.test.ts`
- Modify: `lib/converters/caption-edit.ts`
- Modify: `components/caption-tool/CaptionEditor.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `lib/converters/__tests__/caption-edit.test.ts` (update the import):

```ts
import { splitWord, mergeWordWithNext, insertWordAfter, setWordTiming, nudgeWord, nudgeAllWords } from '../caption-edit'
```

Append:

```ts
describe('nudgeAllWords', () => {
  it('shifts every word by the same delta', () => {
    const out = nudgeAllWords(words, -0.1)
    expect(out[0].start).toBeCloseTo(0)
    expect(out[0].end).toBeCloseTo(0.9)
    expect(out[1].start).toBeCloseTo(0.9)
    expect(out[1].end).toBeCloseTo(1.4)
  })

  it('clamps a word at 0 without blocking later words', () => {
    const early = [
      { text: 'Hi', start: 0.05, end: 0.3 },
      { text: 'there', start: 1.0, end: 1.4 },
    ]
    const out = nudgeAllWords(early, -0.1)
    expect(out[0].start).toBe(0)
    expect(out[0].end).toBeCloseTo(0.2)
    expect(out[1].start).toBeCloseTo(0.9)
    expect(out[1].end).toBeCloseTo(1.3)
  })
})
```

The fixture `words` in that file is `[{ text: 'Hello there', start: 0, end: 1 }, { text: 'world', start: 1, end: 1.5 }]`. After −0.1s: first start clamps to 0, end 0.9; second 0.9–1.4.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/converters/__tests__/caption-edit.test.ts`

Expected: FAIL — `nudgeAllWords` is not exported.

- [ ] **Step 3: Implement `nudgeAllWords`**

Add to `lib/converters/caption-edit.ts`:

```ts
export function nudgeAllWords(words: WordChunk[], deltaSec: number): WordChunk[] {
  return words.map((w) => {
    const start = Math.max(0, w.start + deltaSec)
    return { ...w, start, end: Math.max(start + 0.05, w.end + deltaSec) }
  })
}
```

Do not chain `nudgeWord` in a reduce — each word must receive the full delta independently so an early clamp cannot shrink later shifts.

- [ ] **Step 4: Add Shift all buttons**

In `components/caption-tool/CaptionEditor.tsx`:

1. Import `nudgeAllWords` next to `nudgeWord`.
2. After the existing per-word `−0.1s` / `+0.1s` buttons, add:

```tsx
          <button
            type="button"
            onClick={() => onChange(nudgeAllWords(words, -0.1))}
            disabled={words.length === 0}
            className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-bg-muted disabled:opacity-40"
          >
            Shift all −0.1s
          </button>
          <button
            type="button"
            onClick={() => onChange(nudgeAllWords(words, 0.1))}
            disabled={words.length === 0}
            className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-bg-muted disabled:opacity-40"
          >
            Shift all +0.1s
          </button>
```

Keep the per-word buttons. No new state. The existing `onChange` already updates preview and burn.

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/converters/__tests__/caption-edit.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/converters/caption-edit.ts lib/converters/__tests__/caption-edit.test.ts components/caption-tool/CaptionEditor.tsx
git commit -m "feat(captions): shift all word timings by 0.1s"
```

---

### Task 3: Follow active-word scale (preview + burn)

**Files:**
- Modify: `lib/converters/caption-layout.ts`
- Modify: `lib/converters/__tests__/caption-layout.test.ts` (create if missing)
- Modify: `lib/converters/__tests__/caption-ass-builder.test.ts`
- Modify: `lib/converters/caption-ass-builder.ts`
- Modify: `lib/converters/caption-draw.ts`

- [ ] **Step 1: Write the failing tests**

If `lib/converters/__tests__/caption-layout.test.ts` does not exist, create it:

```ts
import { describe, expect, it } from 'vitest'
import { FOLLOW_ACTIVE_WORD_SCALE } from '../caption-layout'

describe('FOLLOW_ACTIVE_WORD_SCALE', () => {
  it('is 112 percent', () => {
    expect(FOLLOW_ACTIVE_WORD_SCALE).toBe(1.12)
  })
})
```

Append to `lib/converters/__tests__/caption-ass-builder.test.ts`:

```ts
describe('buildASS - karaoke active word scale', () => {
  it('scales only the overlay word to 112 percent', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'karaoke' })
    expect(ass).toContain('\\fscx112')
    expect(ass).toContain('\\fscy112')
    expect(ass).toContain('\\fscx100')
    expect(ass).toContain('\\fscy100')
    const overlay = ass.split('\n').find((l) => l.startsWith('Dialogue: 1,') && l.includes('\\fscx112'))
    expect(overlay).toBeTruthy()
    expect(overlay).toMatch(/\\c&H0000FFFF\\fscx112\\fscy112Hello\\c&H00FFFFFF\\fscx100\\fscy100/)
  })

  it('does not scale One Word dialogue', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'mrbeast' })
    expect(ass).not.toContain('\\fscx112')
  })
})
```

`DEFAULT_CAPTION_OPTIONS.highlightColor` is `#FFFF00` → `&H0000FFFF`. `primaryColor` is `#FFFFFF` → `&H00FFFFFF`. First word is `Hello`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/converters/__tests__/caption-layout.test.ts lib/converters/__tests__/caption-ass-builder.test.ts`

Expected: FAIL — `FOLLOW_ACTIVE_WORD_SCALE` missing; karaoke ASS has color tags only.

- [ ] **Step 3: Add the scale constant**

Add to `lib/converters/caption-layout.ts`:

```ts
/** Follow (karaoke) spoken word vs the rest of the line. */
export const FOLLOW_ACTIVE_WORD_SCALE = 1.12

export function followActiveWordScalePercent(): number {
  return Math.round(FOLLOW_ACTIVE_WORD_SCALE * 100)
}
```

- [ ] **Step 4: Scale the karaoke ASS overlay**

In `lib/converters/caption-ass-builder.ts`, add to the layout import:

```ts
import {
  captionAlignment,
  captionFontSizePx,
  captionMarginVPx,
  captionOutlinePx,
  followActiveWordScalePercent,
} from './caption-layout'
```

Replace the overlay word mapping inside `karaokeEvents`:

```ts
    group.forEach((w, i) => {
      const pct = followActiveWordScalePercent()
      const overlay = group.map((word, j) => {
        const t = getText(word)
        return j === i
          ? `{\\c${highlight}\\fscx${pct}\\fscy${pct}}${t}{\\c${primary}\\fscx100\\fscy100}`
          : t
      }).join(' ')
      events.push(dialogue(w.start, w.end, overlay, 1))
    })
```

Leave layer 0 (full line, primary) unscaled.

- [ ] **Step 5: Scale the preview canvas active word**

In `lib/converters/caption-draw.ts`, import `FOLLOW_ACTIVE_WORD_SCALE` from `./caption-layout`.

In the karaoke branch of `drawCaptionOverlay`, the current loop is:

```ts
      for (const word of lineWords) {
        const t = (options.uppercase ? word.text.toUpperCase() : word.text) + ' '
        ctx.fillStyle = word === activeWord ? options.highlightColor : options.primaryColor
        ctx.fillText(t, offsetX, lineYs[i])
        offsetX += ctx.measureText(t).width
      }
```

Replace with:

```ts
      const baseFont = ctx.font
      const scaledFs = Math.max(1, Math.round(fs * FOLLOW_ACTIVE_WORD_SCALE))
      const weight = isWordByWord ? 'bold ' : ''
      for (const word of lineWords) {
        const t = (options.uppercase ? word.text.toUpperCase() : word.text) + ' '
        const active = word === activeWord
        ctx.fillStyle = active ? options.highlightColor : options.primaryColor
        ctx.font = active ? `${weight}${scaledFs}px "${fontName}", Arial` : baseFont
        ctx.fillText(t, offsetX, lineYs[i])
        offsetX += ctx.measureText(t).width
      }
      ctx.font = baseFont
```

`isWordByWord` is false for karaoke, so weight is empty — that is correct. Do not change the mrbeast/tiktok fill path.

- [ ] **Step 6: Run tests**

Run: `npx vitest run lib/converters/__tests__/caption-layout.test.ts lib/converters/__tests__/caption-ass-builder.test.ts lib/converters/__tests__/caption-words.test.ts lib/converters/__tests__/caption-edit.test.ts`

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add lib/converters/caption-layout.ts lib/converters/caption-ass-builder.ts lib/converters/caption-draw.ts lib/converters/__tests__/caption-layout.test.ts lib/converters/__tests__/caption-ass-builder.test.ts
git commit -m "feat(captions): scale Follow active word to 112 percent"
```

---

## Manual verification (after all tasks)

- Transcribe a short clip, choose Follow: highlight should land with the voice (120 ms earlier than before).
- Shift all −0.1s: whole line highlights earlier; Start/End fields move; burn matches preview.
- Import an SRT: times are unchanged (no 120 ms lead).
- One Word / Outline / Bar / Classic: font size unchanged.

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| 120 ms lead on Whisper words | Task 1 |
| Clamp start ≥ 0, min span 0.05 | Task 1 |
| Skip estimated / zero-span | Task 1 |
| Lead in `transcribeToWords` only | Task 1 |
| SRT import untouched | Task 1 (no call on import path) |
| `nudgeAllWords` | Task 2 |
| Shift all ±0.1s UI | Task 2 |
| Independent clamp (later words still full delta) | Task 2 |
| Follow 112% preview | Task 3 |
| Follow 112% ASS overlay | Task 3 |
| Other styles unscaled | Task 3 |

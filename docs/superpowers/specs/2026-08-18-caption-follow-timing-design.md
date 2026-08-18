# Add Captions — Follow Timing Lead + Active-Word Scale

**Date:** 2026-08-18
**Status:** Approved
**Scope:** Whisper word timestamps and Follow (karaoke) highlight rendering on `/add-captions-to-video`
**Goal:** Make the Follow spoken-word highlight land with the voice (it currently feels late), give a Shift-all control to tune the whole track, and draw the active Follow word slightly larger than the rest of the line.

## Problem

Follow (`styleId: 'karaoke'`) highlights the word whose `[start, end)` contains `video.currentTime`. Whisper word stamps from transformers.js sit ~80–200 ms after the spoken audio, so the color flip is consistently late. The editor can nudge one word at a time; there is no way to shift the whole transcript.

Follow is the only style that shows both highlighted and unhighlighted words on screen at once. The active word is color-only; it does not read as “the spoken word” strongly enough.

## Design

### 1. Automatic 120 ms lead on Whisper output

Constant: `WHISPER_WORD_LEAD_SEC = 0.12`.

After `wordsFromTranscription()` returns a Whisper result with real timings (`timestampsEstimated === false` and at least one word with `end > 0`), apply:

```
start' = max(0, start - 0.12)
end'   = max(start' + 0.05, end - 0.12)
```

Apply in `transcribeToWords` (or a small helper `applyWhisperWordLead(words)` called from there) so every caption consumer of Whisper gets the same times. Preview, ASS burn, and the editor numbers are the same list.

Do **not** apply the lead when:

- `timestampsEstimated === true` (no usable timings)
- words came from `parseSubtitleText` / SRT/VTT import

Re-transcribe replaces the list and applies the lead again. Import replaces the list and does not apply the lead.

### 2. Shift all

Add `nudgeAllWords(words, deltaSec)` in `caption-edit.ts`. Same math as `nudgeWord` on every index: shift start and end together, clamp start to ≥ 0, keep `end >= start + 0.05`.

In `CaptionEditor`, next to the existing per-word `−0.1s` / `+0.1s` buttons, add **Shift all** `−0.1s` / `+0.1s`. Same 0.1 s step. Disabled when `words.length === 0`.

No separate stored offset. After Shift all, the Start/End fields and the burned file match.

### 3. Follow active-word scale

Constant: `FOLLOW_ACTIVE_WORD_SCALE = 1.12` (112% of the line font size).

**Preview** (`caption-draw.ts`, karaoke branch only): when filling the active word, set `font` to `1.12 * captionFontSizePx` for that glyph run, then restore the line size. Measure that word with the scaled font so the rest of the line does not overlap. Non-active words stay at the line size.

**Burn** (`caption-ass-builder.ts` `karaokeEvents`): on the layer-1 overlay, wrap only the active word in `{\c<highlight>\fscx112\fscy112}…{\c<primary>\fscx100\fscy100}`. Other words unchanged. Layer 0 (full line, primary) stays unscaled so the layout width is stable.

One Word (`mrbeast`) and Outline (`tiktok`) stay a single size. Bar and Classic have no per-word highlight.

## Non-goals

- Energy/onset snapping or per-word DTW refinement
- Closing inter-word gaps / snapping `end[i]` to `start[i+1]`
- Stopping the 30 s client-side audio slice (separate timing-quality work)
- A continuous slider or custom millisecond field
- Changing default transcription quality or the Whisper model
- Scaling the highlight on styles other than Follow

## Files

| File | Change |
|------|--------|
| `lib/converters/caption-edit.ts` | Add `nudgeAllWords` |
| `lib/converters/caption-words.ts` | Add `applyWhisperWordLead` + export the 0.12 s constant |
| `lib/converters/caption-transcribe.ts` | Apply lead to Whisper words before return |
| `components/caption-tool/CaptionEditor.tsx` | Shift all −0.1s / +0.1s |
| `lib/converters/caption-draw.ts` | 112% font on active Follow word |
| `lib/converters/caption-ass-builder.ts` | `\fscx112\fscy112` on active Follow word |
| `lib/converters/__tests__/caption-edit.test.ts` | nudge-all + clamp |
| `lib/converters/__tests__/caption-words.test.ts` | lead applied / clamp / skip estimated |
| `lib/converters/__tests__/caption-ass-builder.test.ts` | karaoke overlay includes scale tags |

## Error handling

| Case | Behavior |
|------|----------|
| Word start < 0.12 s | start clamps to 0; end stays ≥ start + 0.05 |
| Shift all would push a word below 0 | that word’s start clamps to 0; later words still shift the full delta |
| Empty transcript | Shift all disabled |
| SRT/VTT import | no automatic lead |
| Estimated timestamps | no automatic lead; existing warning stays |

## Verification

- Unit: Whisper words at `0.50–0.80` become `0.38–0.68`
- Unit: Whisper word at `0.05–0.20` becomes `0.00–0.08` (0.05 min span)
- Unit: estimated / zero-span words are unchanged
- Unit: `nudgeAllWords(words, -0.1)` moves every start/end by −0.1 (with clamp)
- Unit: karaoke ASS overlay for the active word contains `\fscx112` and `\fscy112`
- Manual: Follow preview highlight lands with the voice on a short clip after Transcribe
- Manual: Shift all −0.1s moves the whole highlight earlier; burn matches preview
- Manual: imported SRT is not shifted 120 ms
- Manual: One Word / Outline / Bar / Classic font size unchanged

# Transcription — Vocabulary Prompt, Glossary, and Captions Audio Path

**Date:** 2026-08-24
**Status:** Draft (design approved in conversation)
**Slug:** `/transcription`
**Approach:** Prompt every Whisper window + exact glossary; reuse captions extract/decode. No chunked streaming UI. No editor changes.

## 1. Purpose

Users lose proper nouns and domain terms: Whisper hears clear speech and emits a nearby common word. This pass makes listed names and jargon more likely at decode time and corrects leftovers after, while feeding Whisper the same 16 kHz mono PCM path the captions tool already uses.

Local-only is unchanged. Files never leave the browser.

## 2. Goals and non-goals

**Goals**

- One **Names & terms** field (comma or newline) shared by Whisper prompt and post-decode glossary.
- Exact whole-word / whole-phrase glossary using the user’s spelling.
- Audio files: `decodeAudioViaWebAudio` (explicit resample to 16 kHz).
- Video files: captions `extractAudio`, then `releaseCaptionExtractRuntime` before Whisper.
- Captions tool behavior unchanged when no prompt is passed.
- Unit tests for parse, glossary, leak strip, and audio-path wiring (mocked).

**Non-goals**

- Click-to-seek, playhead highlighting, or other editor work.
- Live streaming transcript text / sliced Whisper windows for progress.
- Fuzzy glossary (`convert yard` → `ConvertYard` unless the user listed that phrase).
- Speaker diarization, saved glossaries, per-file term lists.
- New Whisper model sizes or WebGPU.
- Changing Fast / Balanced / Accurate or language options.

## 3. Architecture

```
Names & terms field
        │
        ▼
parseTranscriptTerms ──► buildWhisperVocabPrompt ──► worker (decoder prefix)
        │
        │                audio/video file
        │                     │
        │                     ▼
        │              pcmForTranscription
        │              (Web Audio / extractAudio)
        │                     │
        │                     ▼
        │              release ffmpeg (video)
        │                     │
        │                     ▼
        │                   Whisper
        │                     │
        ▼                     ▼
apply glossary ◄── strip prompt leak (once, at start)
        │
        ▼
   TXT / SRT → existing TranscriptEditor
```

**Units**

| Unit | Does | Used by | Depends on |
|------|------|---------|------------|
| `transcript-terms.ts` | Parse, prompt string, glossary, leak strip | `transcription.ts`, page (count/helper) | none |
| PCM helper in `transcription.ts` | File → 16 kHz mono | `transcribeBatch` | `audio-decode`, `caption-transcribe` |
| Worker prompt inject | Encode `<\|startofprev\|>` + prompt; prepend decoder start tokens | `transcription-worker` | loaded pipeline tokenizer/model |
| Page field | Collect raw string; pass into batch options | `/transcription` | parse for live count only |

## 4. Terms, prompt, glossary

### 4.1 Parse (`parseTranscriptTerms`)

- Split on commas and newlines (not spaces — `Web Assembly` as one line is one term).
- Trim; drop empty; drop length `< 3`.
- De-dupe case-insensitively; keep the first spelling.
- Cap at **40** terms (keep first 40).
- Empty input → `[]`.

### 4.2 Prompt string (`buildWhisperVocabPrompt`)

- Join terms with `, ` and a trailing `.` → `ConvertYard, Garrick, WebAssembly.`
- Truncate the joined string to **180 characters** at a term boundary when possible; otherwise hard cut.
- Empty terms → `''` (worker skips injection).

### 4.3 Whisper injection (every 30s window)

transformers.js **4.2.0** documents `prompt_ids` as applying per chunk, but `WhisperForConditionalGeneration.generate()` does not read `prompt_ids`. Do not rely on that field.

Instead, in the worker after the pipeline is loaded:

1. Encode `<|startofprev|>` + prompt string with `whisperPipeline.tokenizer`. Drop a leading BOS / start-of-transcript id if the encode includes it.
2. Build decoder start tokens the same way the model does (`_retrieve_init_tokens` with `language`, `task: 'transcribe'`, and whether timestamps are on). If that method is not callable, reconstruct: `<|startoftranscript|>` + language + `<|transcribe|>` + optional `<|notimestamps|>`.
3. Pass `decoder_input_ids` as `[...promptIds, ...initTokens]` into the existing pipeline call (alongside `chunk_length_s: 30`, `stride_length_s: 3`).
4. Cap prompt ids at **100** tokens.

If encode or injection throws, log and transcribe **without** a prompt. The file must still complete; glossary still runs.

Captions continues to call `transcribeAudio` with no prompt.

### 4.4 Leak strip (`stripVocabPromptLeak`)

Run on Whisper `text` and on each chunk’s `text` before glossary.

Strip **once from the start** (after optional leading whitespace) if it matches:

- the full prompt string, or
- the comma-joined list without the trailing period, or
- a `Vocabulary:` prefix plus that list.

Do not remove the same names later in the body.

### 4.5 Glossary (`applyTranscriptGlossary` / `applyTranscriptGlossaryToSrt`)

- Longest term first.
- Case-insensitive; replace with the user’s spelling.
- Whole token or whole phrase: word boundaries around the term; spaces inside a multi-word term are literal.
- Skip a span that already matches exactly.
- Escape regex metacharacters in terms (`C++`).
- Never throw.
- SRT: split blocks; leave index lines and `-->` lines unchanged; apply glossary to cue text only.
- Apply to `text` always; apply to `srt` when `outputFormat === 'srt'`. Then set `output` via existing `selectTranscriptionOutput`.

## 5. Audio path

Replace the local `decodeAudio` / `extractAudioFromVideo` helpers in `lib/converters/transcription.ts`.

```
pcmForTranscription(file):
  if video (MIME or extension):
    pcm = await extractAudio(file)   // from caption-transcribe
    await releaseCaptionExtractRuntime()
    return pcm
  return decodeAudioViaWebAudio(file)
```

Video detection stays the current extension/MIME list.

On desktop, model load may run in parallel with the first file’s extract (captions already do this). On phones, keep extract → release ffmpeg → load model → transcribe so the two WASM heaps are not resident together.

Progress mapping stays coarse (no per-window streaming): extract/decode ~5–25%, transcribe 25–95%, done 100%.

## 6. UI and copy

Options card (idle, files queued), after Language, before Output format:

- Label: **Names & terms**
- Placeholder: `ConvertYard, Garrick, WebAssembly`
- Helper: `Comma or new line. Hints Whisper and fixes spellings after.`
- Live count from `parseTranscriptTerms`: `N terms` or `Using the first 40 terms.`
- Field is not persisted across reloads.

FAQ (`content/tools/transcription.ts`):

- New: names/jargon stay in the browser; they hint Whisper and correct the finished text; listing a term does not invent speech that was not there.
- Accuracy FAQ: mention the field as the way to lock spellings of names and jargon.

## 7. API changes

`TranscriptionOptions` gains `terms: string` (raw textarea value, default `''`). `transcribeBatch` calls `parseTranscriptTerms` once. The page uses the same parser only for the live count.

`transcribeAudio` keeps its current positional args and adds optional `prompt?: string` **after** `signal`, so existing captions calls (`transcribeAudio(slice, rate, language, 'word', onProgress, signal)`) stay valid.

Worker `TranscribeMsg` gains `prompt?: string`. Empty or omitted → no decoder prefix.

## 8. Error handling

| Failure | Behavior |
|---------|----------|
| Empty terms | Today’s path |
| Prompt encode/inject fails | Continue; glossary still runs |
| Decode fails | `AUDIO_DECODE_FAILED` (existing classifier) |
| Video extract fails | `VIDEO_AUDIO_EXTRACT_FAILED` |
| Glossary | Cannot fail the job |
| Captions, no prompt | Bit-identical call shape besides unused optional param |

## 9. Files

| File | Change |
|------|--------|
| `lib/converters/transcript-terms.ts` | New: parse, prompt, leak strip, glossary |
| `lib/converters/__tests__/transcript-terms.test.ts` | New unit tests |
| `lib/converters/transcription.ts` | PCM path; apply leak + glossary; options |
| `lib/converters/transcription-client.ts` | Optional `prompt` through to worker |
| `lib/converters/transcription-worker.ts` | Encode + `decoder_input_ids` inject |
| `lib/converters/__tests__/transcription.test.ts` | Glossary/output + mocked extract/decode |
| `lib/converters/__tests__/transcription-client.test.ts` | Prompt forwarded; omitted for captions-style calls |
| `app/(tools)/transcription/page.tsx` | Field + pass terms into batch |
| `content/tools/transcription.ts` | FAQ |

Do not change `components/transcription/transcript-editor.tsx` or caption UI.

## 10. Testing

**`transcript-terms.test.ts`**

- Commas, newlines, trim, `< 3` char drop, de-dupe, 40-cap.
- Prompt join, 180-char truncation at term boundary.
- Glossary: longest-first, exact skip, phrase term, escaped `C++`.
- SRT: cue text only; timestamps untouched.
- Leak: prefix stripped once; later occurrence kept.

**`transcription.test.ts`**

- After batch helpers: glossary applied to txt and srt `output`.
- Audio file calls `decodeAudioViaWebAudio`; video calls `extractAudio` then `releaseCaptionExtractRuntime` (mocks).

**`transcription-client.test.ts`**

- Prompt included on transcribe message when provided.
- Omitted when undefined.

No real Whisper / ONNX in CI. Manual check on `/transcription`: listed name appears with the user’s spelling on a short clip that previously missed it; empty field matches current output; SRT timestamps still parse.

## 11. Success criteria

1. Listed terms that Whisper almost-gets become the user’s spelling in TXT and SRT.
2. Empty terms field does not run glossary or prompt injection. PCM still comes from the captions/Web Audio path (that is an intentional decode change, not a glossary change).
3. Android/sample-rate mismatch is fixed for audio files via `resampleMono`.
4. Video extract no longer uses the transcription-only ffmpeg helper.
5. Captions tests and call sites pass without a prompt.
6. Prompt injection failure does not fail the file.

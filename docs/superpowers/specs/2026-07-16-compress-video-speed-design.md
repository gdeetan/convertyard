# Compress Video Speed Optimizations — Design Spec

**Date:** 2026-07-16  
**Scope:** `lib/converters/ffmpeg.ts`, `lib/converters/media-probe.ts`  
**Goal:** Speed up video compression (especially target-size sub-pages) without compromising perceptible output quality. Multi-threading excluded due to COOP/COEP header risk to ad slots.

---

## Summary

Four optimizations, all applied automatically in target-size mode. No new UI. No quality compromise visible to normal users.

| Optimization | Speed gain | Quality impact |
|---|---|---|
| 1-pass ABR instead of 2-pass VBR | ~2× faster | Visually identical |
| Auto-scale hi-res input for small targets | 2–4× faster | Improves (more bits per pixel) |
| Adaptive audio bitrate | Minor | More video budget |
| Copy audio if source is already AAC | Minor | None |

---

## Section 1: 1-pass ABR (replaces 2-pass VBR)

**Current behavior:** Target-size mode encodes the video twice — pass 1 analyzes, pass 2 encodes to the calculated bitrate.

**New behavior:** Single pass with:
```
-b:v [calculated] -maxrate [1.5× bitrate] -bufsize [2× bitrate]
```

- Bitrate formula unchanged: `videoBitsPerSec = (targetBytes × 8 - audioBits × duration) / duration`
- Floor of 100,000 bps unchanged
- `maxrate` and `bufsize` constrain the encoder to stay near target without a second pass
- Passlog temp files (`cv_pass_${i}-0.log`) are eliminated
- CRF iteration fallback (when duration probe fails) is unchanged — already single-pass

**Quality rationale:** 1-pass ABR with a 1.5× maxrate / 2× bufsize is visually indistinguishable from 2-pass VBR for typical web content. Difference is only measurable on highly scene-complexity-varying content.

---

## Section 2: Auto-scale hi-res inputs for small targets

**Trigger:** Target-size mode only, when user resolution is set to `"original"`.

**Logic:**
```
target ≤ 10 MB  → cap source at 720p  (if source height > 720)
target ≤ 50 MB  → cap source at 1080p (if source height > 1080)
target > 50 MB  → no auto-scale
```

**Implementation:**
- Add `probeVideoDimensions(file): Promise<{ width: number; height: number } | null>` to `media-probe.ts`
- Call it inside `compressVideo()` before assembling ffmpeg args, only in target-size mode
- Derive an `effectiveResHeight` that is the minimum of: user-selected resolution height (if set) and auto-scale threshold
- Inject `scale=-2:${effectiveResHeight}` filter if `effectiveResHeight < sourceHeight`

**Quality rationale:** At a 50MB budget, a 4K source gets ~1 Mbps video bitrate — barely enough for 720p quality. Scaling to 1080p before encode means the same bits cover fewer pixels, producing a visibly sharper result. Auto-scale is both faster and higher quality.

**User control:** User-selected resolution still takes precedence. If user explicitly chose 720p, it stays 720p regardless of auto-scale threshold.

---

## Section 3: Adaptive audio bitrate

**Current behavior:** Fixed 128 kbps AAC audio in all target-size encodes.

**New behavior:**
```
target ≤ 10 MB  → 64 kbps
target ≤ 50 MB  → 96 kbps
target > 50 MB  → 128 kbps (unchanged)
```

**Implementation:**
- Derive `adaptiveAudioBitrateKbps` from `targetKB` before assembling `audioArgs`
- Replace hardcoded `128_000` in the bitrate formula with `adaptiveAudioBitrateKbps * 1000`
- `stripAudio` path unaffected

**Quality rationale:** 64 kbps AAC is transparent for voice/music at 10MB budgets. Freed bits go to video, improving overall output at small sizes.

---

## Section 4: Copy audio if source is already AAC

**New behavior:** If the source file's audio stream is AAC and its bitrate is within tolerance of our adaptive target, skip audio re-encoding.

**Implementation:**
- Add `probeAudioCodec(file): Promise<{ codec: string; bitrateKbps: number } | null>` to `media-probe.ts`
- In `compressVideo()`, probe audio before assembling `audioArgs`
- Use `-c:a copy` if:
  - `codec === 'aac'`
  - `sourceAudioBitrateKbps <= adaptiveAudioBitrateKbps + 16` (16 kbps tolerance)
  - `stripAudio` is false
- Otherwise fall back to re-encode at adaptive bitrate

**Quality rationale:** Stream copy preserves the original audio exactly — no generation loss, no re-encode artifacts. The tolerance check prevents copying high-bitrate AAC (e.g. 320 kbps) that would overshoot the size target.

---

## Files Changed

- `lib/converters/media-probe.ts` — add `probeVideoDimensions()`, `probeAudioCodec()`
- `lib/converters/ffmpeg.ts` — update `compressVideo()`: 1-pass ABR, auto-scale, adaptive audio, audio copy
- `lib/converters/__tests__/compress-video.test.ts` — update/add tests for new paths

## Files Not Changed

- Tool pages (`app/(tools)/compress-video/`)
- Content files (`content/tools/compress-video.ts`, `content/size-targets/`)
- `ffmpeg-client.ts`
- Any UI components

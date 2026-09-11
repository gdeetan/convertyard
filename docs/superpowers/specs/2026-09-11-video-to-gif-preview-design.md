# Video to GIF — Source Preview + Trim — Design Spec

**Date:** 2026-09-11
**Status:** Approved
**Slug:** `/video-to-gif`
**Cluster:** Video & Audio

## Summary

Add a pre-conversion source-video preview to Video to GIF. The user can play the selected clip and set a shared start/end window from a timeline. Conversion is unchanged: one global trim applied to every file, then a ZIP.

This is **not** a live GIF encode. Native `<video>` playback of the in/out range is the preview of what the GIF will cover.

## Decision

Layout **B** (file strip + one player) with **watch + trim** (timeline writes `startTime` / `endTime`).

Rejected:

- **A** — first file only. Too weak for batches.
- **C** — per-file start/end. Options today are one set for the batch; out of scope.

## Current state

- `content/tools/video-to-gif.ts` has no `previewPanel` or `interactivePanel`.
- Options: `startTime`, `endTime`, `fps`, `outputWidth`, `loop` (all global).
- `videoToGif` already loops files and applies the same ffmpeg trim to each.
- `endTime === 0` means “to the end of that file.”
- ToolShell `previewPanel` is read-only. `interactivePanel` can call `onChange`.
- `interactivePanel` renders only in the idle-with-files phase. That is correct: trim UI is only needed before convert. After convert, GIFs preview as images in `ResultList`.

## Out of scope

- Per-file start/end
- Live GIF / ffmpeg preview encode
- Reuse on Video Trimmer, Video to WebP, or MP4 to WebP
- ToolShell API changes
- Playwright coverage (no cheap video-tool e2e to hang this on)

---

## Architecture

Wire a new `VideoToGifPreview` as `interactivePanel` on the Video to GIF config only. No ToolShell changes. No `convertFn` changes except existing ffmpeg behavior.

```
Dropzone
  → ToolShell entries
    → VideoToGifPreview (interactivePanel)
         selectedIndex (local)
         object URL for selected File only
         lazy posters for visible strip items
         onChange('startTime' | 'endTime', seconds)
    → OptionsPanel (start/end number fields stay; fps/width/loop unchanged)
    → Convert → videoToGif(files, options)  // same as today
```

### Why interactivePanel, not previewPanel

Trim must write options. `previewPanel` receives `{ files, results, options }` only.

### Files

**New**

- `components/video-to-gif-preview/video-to-gif-preview.tsx` — panel
- `lib/converters/video-to-gif-preview-utils.ts` — pure trim/loop math
- `lib/converters/__tests__/video-to-gif-preview-utils.test.ts`

**Modified**

- `content/tools/video-to-gif.ts` — set `interactivePanel: VideoToGifPreview`

---

## Components

### `VideoToGifPreview`

Props match `ToolConfig.interactivePanel`:

```ts
{
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}
```

Local state: `selectedIndex` (number). Clamp into `[0, files.length - 1]` whenever `files.length` changes. Do not reset to 0 on append if the current index is still valid.

Writes **only** `startTime` and `endTime`. Never writes fps, width, or loop.

### File strip

- Hidden when `files.length === 1`.
- Horizontal scroller when `files.length > 1`.
- Each item: lazy poster + filename (truncate).
- Selected item: ring / outline.
- Click selects; does not change options.
- Copy under the strip: `All N files use this start/end window.`

Posters: canvas still from `video` + `seeked`, same approach as `RotateVideoPreview`. Generate only when the item intersects the viewport. Revoke poster blob URLs on unmount or when that file leaves the list.

### Player

- Native `<video>` for `files[selectedIndex]` via `URL.createObjectURL`.
- One playback URL at a time; revoke the previous URL when the selection changes or the panel unmounts.
- Muted by default (GIF has no audio). Native unmute control stays available.
- Do not autoplay on file select.
- Playhead loops inside the resolved window `[start, end]`. If `currentTime` reaches or passes `end`, seek to `start`.
- If the browser cannot decode the file (`error` on the media element, or `videoWidth === 0` after loaded metadata fails): show the filename and `Preview unavailable in this browser — conversion still works.` Do not block Convert.

### Timeline

Custom bar under the player. Native video controls may remain for play/pause/volume; they are not the trim UI.

- Click the bar: seek within the video.
- Two handles: in and out.
- **Mark start** / **Mark end** buttons set in/out to the current playhead.
- Minimum window: 0.1s. Ignore a drag or mark that would invert or collapse below 0.1s.
- Handle hit targets ≥ 44px on the pointer axis (mobile).

`endTime === 0` (default): overlay treats out as this file’s duration. The stored option stays `0` until the user moves the out handle or hits Mark end.

Dragging the out handle to this file’s EOF **writes that duration** as `endTime`, so longer files in the batch get the same window.

If the user then wants “to the end of every file” again, they set End time to `0` in the number field.

### Options panel

Keep Start time / End time number fields. Timeline and fields are two-way:

- Handle / mark → `onChange` → fields update.
- Field / preset → `options` prop → overlay and loop window update.

If the playhead sits outside the new window after an options change, snap it into the window.

FPS, width, and loop stay in Options only.

---

## Batch rules

| Situation | Behavior |
|---|---|
| 1 file | Strip hidden. Player + timeline only. |
| N files | Strip + one player. Same `startTime`/`endTime` for every file. |
| Switch selected file | Do not rewrite start/end. |
| Selected duration < window | Clip overlay to `[start, min(end, duration)]`. Show: `This clip is shorter than the trim window. Conversion will use what this file has.` |
| Selected duration ≤ start | Overlay disabled for playback loop. Same warning. Convert still runs; ffmpeg stops at EOF. |
| Files added | Keep selection if still in range. |
| Files removed | Clamp `selectedIndex`. Revoke URLs for removed files. |

Global trim is a time window in seconds, not a percentage of each file.

---

## Error handling

- **Won’t play:** filename + preview-unavailable copy. Convert enabled.
- **No metadata / duration 0:** timeline disabled. Number fields and Convert still work.
- **Start ≥ end from number fields:** timeline refuses to invert. Do not add a convert-time start≥end check; `videoToGif` does not have one today.
- **Object URLs:** revoke on selection change, file removal, and unmount. Poster blobs too.
- **Large batches:** only the selected file has a playback URL. Posters are lazy. No extra ffmpeg work.

---

## Trim math (pure helpers)

`lib/converters/video-to-gif-preview-utils.ts` owns:

- `MIN_WINDOW_S = 0.1`
- `resolveWindow(startTime, endTime, duration)` → `{ start, end }`
  - `start = max(0, startTime)`
  - `end = endTime > 0 ? endTime : duration`
  - clamp `end` to `duration` for **display/loop** only; do not clamp stored options on file switch
- `wouldInvert(nextStart, nextEnd)` — true if `nextEnd - nextStart < MIN_WINDOW_S`
- `clampSelectedIndex(index, length)`
- `loopPlayhead(currentTime, start, end)` — if `currentTime >= end` (and end > start), return `start`; else return `currentTime`
- `shortFileWarning(start, end, duration)` — boolean or message when duration is below the stored window
- `endHandleWrite(end, duration)` — if `end >= duration`, return `duration`; else return `end`

These functions take numbers only. No DOM.

---

## Testing

Unit tests in `lib/converters/__tests__/video-to-gif-preview-utils.test.ts`:

1. `endTime === 0` → window is `start` → `duration`
2. `endTime > 0` → window uses that end, display-clamped to duration
3. dragging out to EOF writes duration, not `0`
4. start ≥ duration → warning true; resolveWindow still returns a non-inverted display window
5. `loopPlayhead` past end snaps to start
6. `loopPlayhead` inside window is unchanged
7. min window 0.1s: `wouldInvert` true for a 0.05s span
8. `clampSelectedIndex` when the list shrinks (e.g. index 4, length 2 → 1)
9. `clampSelectedIndex` when length is 0 → 0

Existing `video-to-gif.test.ts` ffmpeg tests stay as-is.

No Playwright in this pass.

---

## Copy

- Strip caption: `All N files use this start/end window.`
- Short-file warning: `This clip is shorter than the trim window. Conversion will use what this file has.`
- Decode failure: `Preview unavailable in this browser — conversion still works.`
- Mark buttons: `Mark start`, `Mark end`

No FAQ change required. Optional later: “Can I preview the GIF before converting?” → “You preview the source clip and the trim window. The GIF is encoded on Convert.”

---

## Success criteria

- Dropping one MP4 shows a playable player and a timeline; no strip.
- Dropping three files shows a strip; clicking file 2 plays file 2; start/end do not reset.
- Mark start / Mark end and handle drags update the Options number fields.
- Typing start/end updates the overlay.
- Playback loops inside the window.
- A `.mov` that will not play still allows Convert.
- Convert of N files still produces N GIFs (or per-file errors) and a ZIP, using the same global window.
- Object URLs are revoked (no accumulation when switching selection 20 times).
- Utils tests above pass.

---

## Implementation notes

- Follow existing ConvertYard voice: direct, factual, no superlatives.
- Do not put ads in the panel.
- Do not generate posters for every file eagerly.
- Keep the panel visually inside the tool card: `rounded-xl border border-border`, same density as `RotateVideoPreview`.
- Selected file identity is index into the `files` array ToolShell passes (already in drop order).

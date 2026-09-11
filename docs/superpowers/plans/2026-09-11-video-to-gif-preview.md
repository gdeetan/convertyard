# Video to GIF Source Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a file-strip + native video player with shared start/end trim to `/video-to-gif` before conversion.

**Architecture:** Pure trim math in `video-to-gif-preview-utils.ts`. `VideoToGifPreview` is the tool's `interactivePanel`. It plays the selected source file, writes only `startTime`/`endTime` via `onChange`, and does not encode a GIF. `videoToGif` and ToolShell stay unchanged.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, existing ToolShell `interactivePanel` slot.

**Spec:** `docs/superpowers/specs/2026-09-11-video-to-gif-preview-design.md`

---

## File map

- Create: `lib/converters/video-to-gif-preview-utils.ts`
- Create: `lib/converters/__tests__/video-to-gif-preview-utils.test.ts`
- Create: `components/video-to-gif-preview/video-to-gif-preview.tsx`
- Modify: `content/tools/video-to-gif.ts` — `interactivePanel: VideoToGifPreview`

### Task 1: Trim math (TDD)

- [ ] Write failing tests for `resolveWindow`, `wouldInvert`, `clampSelectedIndex`, `loopPlayhead`, `shortFileWarning`, `endHandleWrite`
- [ ] Run `npx vitest run lib/converters/__tests__/video-to-gif-preview-utils.test.ts` — fail because module missing
- [ ] Implement utils
- [ ] Re-run tests — pass
- [ ] Commit

### Task 2: Preview panel + wire config

- [ ] Implement `VideoToGifPreview` per spec (strip, player, timeline, mark in/out, lazy posters)
- [ ] Set `interactivePanel` on video-to-gif config
- [ ] Re-run utils tests + existing `video-to-gif.test.ts`
- [ ] Commit

### Task 3: Verify and PR

- [ ] Exercise `/video-to-gif` with 1 and 3 files
- [ ] Open PR to `main` (Cloudflare Pages preview + production on merge)

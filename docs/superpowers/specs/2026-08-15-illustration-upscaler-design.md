# Illustration upscaler mode

**Date:** 2026-08-15  
**Status:** approved (approach 2)

## Goal

Add an **Illustration (AI)** option to `/image-upscaler` so logos, badges, line art, comics, and other 2D files get a 2D-trained model instead of Lanczos. Auto-detect sends those files here. Graphic / logo (Lanczos) stays as a manual override.

## Why

Auto-detect already labels few-colour / flat-patch images as graphic. That path is Lanczos + light unsharp, so a sharp 300×300 WebP looks soft at 4×. Users want both icons-with-text and drawings to stay crunchy, in the same tool, still local.

## Behaviour

| Image type | Path |
|---|---|
| Auto-detect + photo / compressed-JPEG signals | Existing photo model (Real-ESRGAN general v3 / Swin2SR) |
| Auto-detect + graphic signals (unique colour ratio < 0.15 or flat-patch ratio > 0.30) | Illustration model |
| Photo (AI) | Photo model |
| Illustration (AI) | Illustration model |
| Graphic / logo (Lanczos) | Lanczos + unsharp, no neural net |

## Model

- **RealESR AnimeVideo v3** (SRVGGNetCompact, 4×, NCHW RGB float32 `[0,1]`).
- Local: `/models/realesr-animevideov3.onnx` (~2.5 MB).
- HF fallback: `tidus2102/Real-ESRGAN` `RealESR-AnimeVideo-v3_x4.onnx`.
- Same tile runner as general v3. WebGPU only (WASM `session.run` deadlocks in this worker).
- If the illustration model cannot load or run: **Lanczos**, not the photo model.
- Lazy-load on first illustration infer. Page preload stays the photo 4× model.

## Scales

Illustration is a 4× model only.

- 4×: one tiled pass.
- 2× / 3× / 8×: 4× pass, then Lanczos to the target size.

## UI / copy

- New radio: **Illustration (AI)** between Photo and Graphic.
- Auto hint: 2D / logo-like files use Illustration; override if wrong.
- Honest limits: not a vectorizer; small type can halo; Graphic / logo is the escape hatch.

## Out of scope

- A second illustration model (anime vs logo).
- Changing tile size, WebGPU policy, or the photo model.
- Server-side inference.

# Cluster 07 — AI-Powered Tools

## Seed keyword

**Primary seed:** `ai tools`

Cluster hub targets the broad term. Individual tools target specific
AI tasks.

**Why this seed:** Captures the category as a whole. AI-tool discovery
behavior is heavy on category-level searches ("AI tools for X").

**Alternate seed worth testing:** `free ai tools no signup` — much
softer SERP, very aligned with the wedge, and captures users who
have been burned by aggressive signup walls on AI sites.

## Secondary anchor keywords

- `background remover` (~50K vol, KD ~55) — also lives in Cluster 02
- `alt text generator` (~5K vol, KD ~25)
- `image upscaler` (~30K vol, KD ~50)
- `audio transcription` (~40K vol, KD ~55)
- `ai image to text` (~15K vol, KD ~40)

## Cluster priority

**Build in parallel from month 0.** Not last. AI tools are the
differentiation — they're the "new searches" being created right now
and the SERPs are still soft for in-browser variants.

## Cluster traffic estimate at maturity

**10,000–20,000 monthly visits**

Growing fastest of all clusters. Search volume for "ai [task]" terms
is expanding 50–200% year-over-year.

## Tools to build (6)

| Tool | Slug | Target keyword | Est. volume | KD |
|---|---|---|---|---|
| Alt text generator (batch) | alt-text-generator | alt text generator | 5K | 25 |
| Image description (AI) | image-description | image to description | 8K | 35 |
| Audio transcription (Whisper) | audio-to-text | audio to text | 30K | 50 |
| Document summarization | summarize-document | summarize pdf | 10K | 40 |
| Photo restoration | photo-restoration | restore old photo | 15K | 45 |
| Image-to-prompt | image-to-prompt | image to prompt | 10K | 40 |

Note: Background remover and image upscaler live in Cluster 02
(Image Editing) but use AI models. Cross-linked between clusters.

## Build order

1. Alt text generator (batch) — EAA compliance wave, low KD,
   high-value B2B audience
2. Audio transcription (Whisper in-browser) — huge demo appeal
3. Image description
4. Image-to-prompt (high search interest, fast to build)
5. Document summarization
6. Photo restoration (heavier model, build later)

## Supporting articles (6)

| Article | Target long-tail | Est. vol | KD |
|---|---|---|---|
| Bulk alt text for accessibility compliance | "alt text accessibility" | 3K | 25 |
| How to generate alt text for 1000 images | "bulk alt text generator" | 500 | 20 |
| Whisper in the browser: how good is it | "whisper browser" | 2K | 25 |
| Web accessibility requirements in 2026 | "wcag 2026" | 3K | 30 |
| AI photo restoration: what works | "ai photo restoration" | 8K | 40 |
| Image descriptions for screen readers | "alt text best practices" | 5K | 35 |

## Internal linking strategy

- Alt text generator + Image description link to each other (overlapping
  intent)
- Audio transcription links to "Whisper in the browser" article
- All AI tools cross-link to the EAA / accessibility articles for SEO
  authority on the topic
- Cluster hub `/ai-tools` aggregates all 6

## Wedge-specific notes

- **In-browser AI is the differentiator.** Every other AI tool site
  uploads to OpenAI/Anthropic/Replicate APIs. Running models locally
  via transformers.js is genuinely rare and exactly aligned with the
  local-first wedge.
- **Models add weight.** Realistic sizes:
  - Alt text/image description: SmolVLM, Moondream ~500MB–2GB
  - Whisper transcription: tiny (75MB), base (150MB), small (500MB)
  - Background removal: BiRefNet/RMBG ~50MB
  - Image upscaling: Real-ESRGAN ~70MB
  
  Cache aggressively after first download. Show clear "downloading
  model" state.
- **EAA compliance is the B2B hook.** The European Accessibility Act
  took effect June 2025. Companies need alt text on existing image
  libraries. A batch tool that takes a ZIP and returns alt-text.csv
  mapped to filenames is genuinely valuable. Market hard to agencies
  and e-commerce.
- **Hybrid option for heavy models.** For the largest models, consider
  an optional clearly-labeled "fast mode" using a cloud API — but only
  with explicit opt-in and prominent UI labeling. Default is local.

## SERP context

- "AI [task]" SERPs are crowded but inconsistent in quality
- Many results are thin landing pages for paid SaaS — long-form
  in-browser tools can compete on usefulness
- Alt text generation is especially soft — the main competitors are
  paid SaaS accessibility platforms

## Watch list

- WebGPU stability — when ubiquitous, makes large-model inference
  3–10x faster in-browser
- New small-but-capable vision models (Moondream2, SmolVLM successors)
  — swap models when accuracy/size ratio improves
- Browser support for the model URL caching APIs — improves repeat-visit
  experience dramatically
- EAA enforcement news — when companies start getting fined, alt-text
  demand will spike

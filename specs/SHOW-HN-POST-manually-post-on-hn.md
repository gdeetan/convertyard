do # Show HN Post — Ready to Submit

**Post timing:** Tuesday–Thursday, 9–11am US Eastern

---

## Title

Show HN: I built a file converter where files never leave your browser (60+ tools, batch up to 1,000 files)

---

## Body

I got tired of uploading sensitive documents to random conversion websites. You don't know who's storing them, for how long, or what they're doing with them. The privacy policies are long. The "we delete files after 1 hour" promises are unverifiable.

The technology to do this locally has been available for years. So I built ConvertYard: https://convertyard.com

**How it works technically**

Everything runs via WebAssembly in the browser tab:

- **Images** (JPG/PNG/WebP/AVIF/HEIC): libvips compiled to WASM. Handles 1,000 files in a single drop, progress tracked per file.
- **PDF**: mupdf-wasm + pdf-lib for merge, compress, split, rotate, OCR, redact, Word→PDF, and more.
- **Video/audio**: ffmpeg.wasm for MP4→MP3 extraction, MP3→MP4 with waveform, format conversion.
- **ML tools** (background remover, alt text generator): @huggingface/transformers.js — models run in-browser, no API call.
- **ZIP packaging**: fflate, because JSZip is slow.

The lazy-loading strategy matters: WASM modules only download on first interaction, so the initial page load is fast. Tool UI renders before WASM finishes loading.

**The honest limitations**

- First-use download: libvips is ~3MB gzipped, ffmpeg.wasm is ~25MB. Subsequent visits are cached.
- RAM-constrained devices: converting 1,000 high-res images in a browser tab on a 2GB phone will struggle. We haven't found the ceiling on desktop yet.
- No server-side fallback: if something can't run in-browser, we don't build it. That rules out some formats.
- Cold-start latency: first conversion after WASM loads has ~200–500ms initialization overhead.

**Why "no upload" is a real feature, not marketing**

Open DevTools → Network while converting. You'll see requests to load WASM modules on first use. You won't see your file bytes going anywhere. That's the only meaningful privacy proof — not a privacy policy, the absence of an upload request.

This matters most for: lawyers handling contracts, HR processing employee documents, healthcare staff converting scanned records, anyone under GDPR or HIPAA who can't casually upload to a third-party processor.

Happy to answer questions about the WASM approach, the libvips binding, or anything else.

---

## Posting checklist

- [ ] Post Tuesday–Thursday, 9–11am US Eastern
- [ ] Be in the thread for the first 2 hours — answer technical questions, not product questions
- [ ] Don't edit the body after posting
- [ ] Submit at: https://news.ycombinator.com/submit

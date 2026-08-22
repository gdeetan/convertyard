const EXAMPLES = [
  {
    src: '/examples/ai-image-detector/chatgpt-upscaled-handshake.svg',
    width: 1200,
    height: 702,
    alt: 'Detector result: generated handshake image scored 100% AI, with no generator tags in metadata.',
    caption:
      'Made in ChatGPT, then upscaled. The filename was renamed so it no longer said ChatGPT. Score: 100% AI. Metadata still empty.',
  },
  {
    src: '/examples/ai-image-detector/elevenlabs-original.svg',
    width: 1200,
    height: 676,
    alt: 'Detector result: ElevenLabs image scored 100% AI, with no generator tags in metadata.',
    caption:
      'Downloaded from ElevenLabs at the original size — no extra upscale. Score: 100% AI. Still no generator tags in the file.',
  },
  {
    src: '/examples/ai-image-detector/jpeg-exif-stripped.svg',
    width: 1200,
    height: 676,
    alt: 'Detector result: JPEG with EXIF removed scored 97% AI.',
    caption:
      'Converted from PNG to JPEG and EXIF stripped. Still flagged as AI, at 97% instead of 100%. The first two files already had no tags, so the dip is the JPEG recompress changing the pixels — not the missing EXIF.',
  },
] as const

export function AiDetectorExamples() {
  return (
    <div className="mt-4 space-y-6">
      {EXAMPLES.map(ex => (
        <figure key={ex.src} className="m-0">
          <img
            src={ex.src}
            alt={ex.alt}
            width={ex.width}
            height={ex.height}
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-lg border border-border bg-white"
          />
          <figcaption className="mt-2 text-sm leading-relaxed text-fg-muted">
            {ex.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

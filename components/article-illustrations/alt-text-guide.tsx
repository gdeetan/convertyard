const ALT_TEXT = "Snow-capped mountain peak at sunset, viewed from a hiking trail"
const CHAR_COUNT = ALT_TEXT.length
const CHAR_MAX = 125

export function AltTextIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Media Library — CMS Editor</span>
      </div>

      {/* Editor body */}
      <div className="px-4 py-4 bg-bg-elevated space-y-3">
        {/* Image thumbnail */}
        <div className="w-full h-[90px] rounded-lg border border-border overflow-hidden bg-gradient-to-br from-[#b0bec5] to-[#78909c] relative">
          {/* Simple mountain SVG */}
          <svg
            viewBox="0 0 400 120"
            className="absolute bottom-0 left-0 w-full"
            preserveAspectRatio="none"
          >
            <polygon points="0,120 80,40 160,90 240,20 320,70 400,30 400,120" fill="rgba(255,255,255,0.15)" />
            <polygon points="0,120 80,55 160,100 240,35 320,80 400,45 400,120" fill="rgba(255,255,255,0.1)" />
          </svg>
          {/* Sun */}
          <div className="absolute top-3 right-6 h-8 w-8 rounded-full bg-yellow-200/60" />
        </div>

        {/* Alt text field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-sans text-[11px] font-semibold text-fg-muted">Alt text</label>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-fg-subtle">{CHAR_COUNT} / {CHAR_MAX}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-sans text-[10px] font-semibold text-green-700">
                <span>✓</span> Descriptive
              </span>
            </div>
          </div>
          <div className="rounded-md border border-border bg-white px-2.5 py-1.5">
            <span className="font-sans text-[11px] text-fg">{ALT_TEXT}</span>
            <span className="inline-block h-3 w-px bg-fg ml-px align-middle" />
          </div>
        </div>

        {/* Warning pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 font-sans text-[11px] text-orange-700">
            <span>⚠</span>
            Missing alt text on 3 other images
          </span>
        </div>
      </div>
    </div>
  )
}

export function WebpQualityIllustration() {
  const quality = 80
  const thumbPos = `calc(${quality}% - 7px)`

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">JPG to WebP — ConvertYard</span>
      </div>

      {/* Options panel body */}
      <div className="px-5 py-4 bg-bg-elevated">
        {/* Label */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-sm font-semibold text-fg">WebP Quality</span>
          <span className="font-mono text-sm font-bold text-primary">{quality}</span>
        </div>

        {/* Slider */}
        <div className="relative h-2 w-full rounded-full bg-bg-muted border border-border mb-1.5">
          <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: `${quality}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary bg-white shadow"
            style={{ left: thumbPos }}
          />
        </div>
        <div className="flex justify-between mb-4">
          <span className="font-mono text-[10px] text-fg-subtle">0 — smallest</span>
          <span className="font-mono text-[10px] text-fg-subtle">100 — lossless</span>
        </div>

        {/* Readout box */}
        <div className="rounded-lg border border-border bg-white px-3 py-2.5 space-y-1.5 mb-3">
          <div className="flex justify-between">
            <span className="font-sans text-[11px] text-fg-muted">Setting</span>
            <span className="font-mono text-[11px] font-semibold text-fg">{quality}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-[11px] text-fg-muted">Estimated size</span>
            <span className="font-mono text-[11px] text-fg">~340 KB</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-[11px] text-fg-muted">vs original JPG</span>
            <span className="font-mono text-[11px] text-fg">1.2 MB</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between">
            <span className="font-sans text-[11px] font-semibold text-fg-muted">Savings</span>
            <span className="font-mono text-[11px] font-bold text-green-600">72%</span>
          </div>
        </div>

        {/* Note */}
        <p className="font-sans text-[11px] text-fg-subtle text-center">
          80 is the sweet spot for most uses
        </p>
      </div>
    </div>
  )
}

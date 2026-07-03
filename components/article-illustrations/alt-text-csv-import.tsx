const CSV_ROWS = [
  { filename: 'hero-image.jpg',  alt: 'Team collaborating around a whiteboard' },
  { filename: 'product-01.jpg', alt: 'Blue ceramic coffee mug, 12oz, matte finish' },
  { filename: 'banner.webp',    alt: 'Summer sale — 40% off all items' },
]

const THUMBS = [
  { color: 'from-[#90caf9] to-[#42a5f5]' },
  { color: 'from-[#80cbc4] to-[#4db6ac]' },
  { color: 'from-[#ffcc80] to-[#ffa726]' },
]

export function AltTextCsvIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Alt Text CSV Import — ConvertYard</span>
      </div>

      {/* Two-panel layout */}
      <div className="flex items-stretch gap-0 bg-bg-elevated">
        {/* Left: CSV panel */}
        <div className="flex-1 border-r border-border px-3 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-4 w-4 rounded-sm bg-green-600 flex items-center justify-center shrink-0">
              <span className="font-mono text-[8px] font-bold text-white leading-none">CSV</span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-fg">alt-text.csv</span>
          </div>

          {/* CSV table */}
          <div className="rounded-md border border-border bg-white overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[100px_1fr] bg-bg-muted border-b border-border px-2 py-1">
              <span className="font-mono text-[9px] font-semibold text-fg-muted">filename</span>
              <span className="font-mono text-[9px] font-semibold text-fg-muted">alt_text</span>
            </div>
            {CSV_ROWS.map((row) => (
              <div key={row.filename} className="grid grid-cols-[100px_1fr] px-2 py-1.5 border-b border-border last:border-0">
                <span className="font-mono text-[9px] text-[#1a73e8] truncate pr-1">{row.filename}</span>
                <span className="font-mono text-[9px] text-fg-muted leading-tight">{row.alt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center px-2 shrink-0">
          <div className="flex items-center gap-0.5">
            <div className="h-px w-4 bg-primary" />
            <span className="text-primary font-bold text-sm">→</span>
          </div>
          <span className="font-sans text-[9px] text-fg-subtle mt-0.5 whitespace-nowrap">Import</span>
        </div>

        {/* Right: WP Media Library */}
        <div className="flex-1 px-3 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-4 w-4 rounded-sm bg-[#21759b] flex items-center justify-center shrink-0">
              <span className="font-mono text-[8px] font-bold text-white leading-none">WP</span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-fg">Media Library</span>
          </div>

          {/* Image thumbnails grid */}
          <div className="flex flex-col gap-1.5">
            {THUMBS.map((thumb, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`h-8 w-10 rounded border border-border bg-gradient-to-br ${thumb.color} shrink-0`} />
                <span className="font-mono text-[9px] text-fg-subtle truncate flex-1">{CSV_ROWS[i].filename}</span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-green-700 shrink-0">
                  ✓ Updated
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-white px-3 py-1.5 text-center">
        <span className="font-mono text-[10px] text-fg-subtle">
          847 images updated · 0 errors
        </span>
      </div>
    </div>
  )
}

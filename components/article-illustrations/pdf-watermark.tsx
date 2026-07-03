export function PdfWatermarkIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center border-b border-[#dadce0] bg-[#f1f3f4] px-4 py-2 gap-2">
        <span className="font-mono text-[11px] text-[#5f6368]">PDF Watermark Tool</span>
        <span className="ml-auto font-sans text-[10px] text-[#80868b]">1 file ready</span>
      </div>

      {/* Main content */}
      <div className="bg-bg-elevated px-6 py-5 flex flex-col items-center gap-4">
        {/* PDF mock page */}
        <div className="relative w-44 bg-white border border-border rounded shadow-sm px-4 py-5 overflow-hidden">
          {/* Fake text lines */}
          <div className="space-y-2">
            <div className="h-2 bg-bg-muted rounded w-full" />
            <div className="h-2 bg-bg-muted rounded w-5/6" />
            <div className="h-2 bg-bg-muted rounded w-full" />
            <div className="h-2 bg-bg-muted rounded w-4/5" />
            <div className="h-2 bg-bg-muted rounded w-full" />
            <div className="h-2 bg-bg-muted rounded w-3/4" />
          </div>

          {/* Diagonal watermark */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <span
              className="font-sans font-bold text-[22px] text-fg opacity-20 whitespace-nowrap tracking-widest"
              style={{ transform: 'rotate(-30deg)' }}
            >
              CONFIDENTIAL
            </span>
          </div>
        </div>

        {/* Option pills */}
        <div className="flex items-center gap-2">
          <button className="rounded-full px-3 py-1 font-sans text-[11px] font-medium bg-primary text-white">
            Text watermark
          </button>
          <button className="rounded-full px-3 py-1 font-sans text-[11px] font-medium border border-border text-fg-muted bg-white">
            Logo watermark
          </button>
        </div>
      </div>
    </div>
  )
}

export function CompressImageQualityIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Image Compressor — ConvertYard</span>
      </div>

      {/* Before / After columns */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-border bg-bg-muted">
        {/* Before */}
        <div className="flex flex-col items-center gap-2 p-4">
          <span className="font-sans text-[10px] font-semibold text-fg-muted uppercase tracking-wide">Before</span>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-red-600">
            4.2 MB
          </span>
          {/* Fake thumbnail */}
          <div className="w-full h-[80px] rounded-md overflow-hidden border border-border">
            <div className="w-full h-full bg-gradient-to-br from-[#c8d0d8] to-[#9aa5b1]" />
          </div>
          <span className="font-mono text-[10px] text-fg-subtle">vacation.jpg</span>
        </div>

        {/* After */}
        <div className="flex flex-col items-center gap-2 p-4">
          <span className="font-sans text-[10px] font-semibold text-fg-muted uppercase tracking-wide">After</span>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-green-700">
            890 KB
          </span>
          {/* Fake thumbnail */}
          <div className="w-full h-[80px] rounded-md overflow-hidden border border-border">
            <div className="w-full h-full bg-gradient-to-br from-[#c8d0d8] to-[#9aa5b1]" />
          </div>
          <span className="font-mono text-[10px] text-fg-subtle">vacation.webp</span>
        </div>
      </div>

      {/* Savings label */}
      <div className="flex justify-center py-2 bg-white border-t border-border">
        <span className="font-sans text-xs font-semibold text-primary">— 79% smaller —</span>
      </div>

      {/* Quality slider */}
      <div className="px-5 pb-4 pt-1 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-[11px] text-fg-muted">Quality</span>
          <span className="font-mono text-[11px] font-semibold text-fg">82</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-bg-muted border border-border">
          <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: '82%' }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white shadow-sm"
            style={{ left: 'calc(82% - 7px)' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[10px] text-fg-subtle">0</span>
          <span className="font-mono text-[10px] text-fg-subtle">100</span>
        </div>
      </div>
    </div>
  )
}

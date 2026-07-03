export function WhatIsHeicIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">HEIC vs JPG — File Compatibility</span>
      </div>

      {/* File cards */}
      <div className="flex items-center gap-0 p-4 bg-bg">

        {/* HEIC card */}
        <div className="flex-1 rounded-lg border-2 border-[#d1d5db] bg-bg-elevated overflow-hidden shadow-sm">
          {/* File icon area */}
          <div className="bg-[#e5e7eb] flex flex-col items-center justify-center pt-4 pb-2 px-3 gap-1">
            {/* Generic file icon */}
            <div className="w-10 h-12 bg-[#9ca3af] rounded-sm relative flex items-center justify-center">
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#6b7280]" style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }} />
              <span className="font-mono text-white text-[9px] font-bold mt-2">HEIC</span>
            </div>
            <p className="font-mono text-[11px] text-fg font-semibold">photo.HEIC</p>
            <p className="font-mono text-[10px] text-fg-muted">2.1 MB</p>
          </div>
          {/* Status */}
          <div className="bg-red-50 border-t border-red-200 flex items-center gap-1.5 px-2.5 py-2">
            <span className="text-red-500 font-bold font-mono text-[13px] leading-none">⊘</span>
            <div>
              <p className="font-sans text-[10px] font-semibold text-red-700">Can&apos;t open</p>
              <p className="font-mono text-[9px] text-red-500">Windows / Android</p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center px-3 gap-1">
          <span className="font-mono text-[10px] text-fg-muted">Convert</span>
          <span className="text-fg-subtle text-lg leading-none">→</span>
        </div>

        {/* JPG card */}
        <div className="flex-1 rounded-lg border-2 border-green-200 bg-green-50 overflow-hidden shadow-sm">
          {/* File icon area */}
          <div className="bg-green-100 flex flex-col items-center justify-center pt-4 pb-2 px-3 gap-1">
            {/* File icon */}
            <div className="w-10 h-12 bg-green-400 rounded-sm relative flex items-center justify-center">
              <div className="absolute top-0 right-0 w-3 h-3 bg-green-500" style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }} />
              <span className="font-mono text-white text-[9px] font-bold mt-2">JPG</span>
            </div>
            <p className="font-mono text-[11px] text-fg font-semibold">photo.jpg</p>
            <p className="font-mono text-[10px] text-fg-muted">1.8 MB</p>
          </div>
          {/* Status */}
          <div className="bg-green-50 border-t border-green-200 flex items-center gap-1.5 px-2.5 py-2">
            <span className="text-green-600 font-bold font-mono text-[13px] leading-none">✓</span>
            <div>
              <p className="font-sans text-[10px] font-semibold text-green-700">Opens everywhere</p>
              <p className="font-mono text-[9px] text-green-500">All platforms</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom strip */}
      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 flex items-center justify-center gap-4">
        <span className="font-mono text-[10px] text-[#5f6368]">HEIC = Apple only</span>
        <span className="font-mono text-[10px] text-[#9ca3af]">·</span>
        <span className="font-mono text-[10px] text-[#5f6368]">JPG = Universal</span>
      </div>
    </div>
  )
}

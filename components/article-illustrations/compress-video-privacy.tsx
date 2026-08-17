export function CompressVideoPrivacyIllustration() {
  const tabs = ['Elements', 'Console', 'Sources', 'Network', 'Performance']

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden font-mono text-[11px]">
      <div className="flex items-center border-b border-[#dadce0] bg-[#f1f3f4] px-2">
        {tabs.map((tab) => (
          <span
            key={tab}
            className={
              tab === 'Network'
                ? 'px-3 py-2 font-sans text-[11px] border-b-2 border-[#1a73e8] text-[#1a73e8]'
                : 'px-3 py-2 font-sans text-[11px] text-[#5f6368]'
            }
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5">
        <span className="rounded border border-[#dadce0] bg-white px-1.5 py-0.5 text-[10px] text-[#5f6368]">
          Clear
        </span>
        <div className="h-4 w-px bg-[#dadce0]" />
        <div className="flex-1 rounded border border-[#dadce0] bg-white px-2 py-0.5 text-[10px] text-[#80868b]">
          Filter
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-1 text-[10px] text-[#5f6368]">
        <span>Name</span>
        <span>Type</span>
        <span>Size</span>
        <span>Time</span>
      </div>

      <div className="divide-y divide-[#f1f3f4] bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-3 py-1.5">
          <span className="truncate text-[#1a73e8]">ffmpeg-core.wasm</span>
          <span className="text-[#5f6368]">wasm</span>
          <span className="text-[#5f6368]">25 MB</span>
          <span className="text-[#5f6368]">1.1 s</span>
        </div>
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-3 py-1.5">
          <span className="truncate text-[#1a73e8]">compress-video.js</span>
          <span className="text-[#5f6368]">script</span>
          <span className="text-[#5f6368]">48 kB</span>
          <span className="text-[#5f6368]">80 ms</span>
        </div>
        <div className="flex items-center gap-2 bg-[#fff8e1] px-3 py-1.5">
          <span className="text-[10px] text-[#e65100]">
            lecture.mov — encoding locally (CRF 23)
          </span>
        </div>
        <div className="px-3 py-1.5 italic text-[#80868b]">
          — no POST / no upload —
        </div>
        <div className="flex items-center gap-2 bg-[#e8f5e9] px-3 py-1.5">
          <span className="text-[#2e7d32]">✓</span>
          <span className="text-[#2e7d32]">
            Done. 186 MB → 24 MB. File never left this tab.
          </span>
        </div>
      </div>

      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1 text-[10px] text-[#5f6368]">
        2 requests · convertyard.com only · 0 bytes of video uploaded
      </div>
    </div>
  )
}

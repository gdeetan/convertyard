const browser = [
  'Compress / hit a size cap',
  'Convert MP4, MOV, WebM, MKV',
  'Extract audio',
  'Trim start and end',
  'Batch a folder → ZIP',
]

const desktop = [
  'Multi-cut timeline',
  'Color grade',
  'Effects, titles, green screen',
  '2-hour 4K encodes',
  'ProRes / MXF / DNxHD',
]

export function BrowserVideoEditingIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">
          Browser vs desktop — video tasks in 2026
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="p-3">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wide text-green-700 mb-2">
            Browser is enough
          </p>
          <ul className="space-y-1.5">
            {browser.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="text-green-600 font-mono text-[11px] leading-5">✓</span>
                <span className="font-sans text-[11px] text-fg leading-5">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-bg">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wide text-orange-700 mb-2">
            Still needs desktop
          </p>
          <ul className="space-y-1.5">
            {desktop.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="text-orange-500 font-mono text-[11px] leading-5">–</span>
                <span className="font-sans text-[11px] text-fg leading-5">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 text-center">
        <span className="font-mono text-[10px] text-[#5f6368]">
          Same ffmpeg quality · no GPU encoder · keep the tab open
        </span>
      </div>
    </div>
  )
}

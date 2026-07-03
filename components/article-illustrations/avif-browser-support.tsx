const BROWSERS = [
  { letter: 'C', label: 'Chrome',  color: 'bg-[#4285f4]', text: 'text-white', version: 'v85+',   date: 'Aug 2020', supported: true  },
  { letter: 'F', label: 'Firefox', color: 'bg-[#ff7139]', text: 'text-white', version: 'v93+',   date: 'Oct 2021', supported: true  },
  { letter: 'S', label: 'Safari',  color: 'bg-[#757575]', text: 'text-white', version: 'v16.4+', date: 'Mar 2023', supported: true  },
  { letter: 'E', label: 'Edge',    color: 'bg-[#0078d4]', text: 'text-white', version: 'v121+',  date: '2024',     supported: true  },
  { letter: 'IE', label: 'IE',     color: 'bg-[#c8c8c8]', text: 'text-[#555]', version: 'None',  date: '',         supported: false },
]

export function AvifBrowserSupportIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <span className="font-sans text-[11px] font-semibold text-[#5f6368]">
          AVIF Browser Support — 2026
        </span>
      </div>

      {/* Browser grid */}
      <div className="grid grid-cols-5 gap-0 divide-x divide-border px-0 py-4 bg-bg-elevated">
        {BROWSERS.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-1.5 px-2">
            {/* Circle logo */}
            <div
              className={`h-9 w-9 rounded-full ${b.color} ${b.text} flex items-center justify-center font-mono text-[11px] font-bold relative`}
            >
              {b.letter}
              {!b.supported && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <div className="absolute h-[2px] w-full bg-red-500 rotate-45 rounded" />
                </div>
              )}
            </div>

            {/* Browser name */}
            <span className="font-sans text-[10px] font-semibold text-fg">{b.label}</span>

            {/* Support indicator */}
            {b.supported ? (
              <span className="text-green-600 text-[12px] leading-none">✓</span>
            ) : (
              <span className="text-red-400 text-[12px] leading-none">✗</span>
            )}

            {/* Version */}
            <span className={`font-mono text-[10px] ${b.supported ? 'text-fg-muted' : 'text-fg-subtle line-through'}`}>
              {b.version}
            </span>

            {/* Date */}
            {b.date && (
              <span className="font-mono text-[9px] text-fg-subtle text-center leading-tight">{b.date}</span>
            )}
            {!b.date && (
              <span className="font-mono text-[9px] text-red-400">No support</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer badge */}
      <div className="border-t border-border px-3 py-2 flex items-center justify-center bg-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-sans text-[11px] font-semibold text-green-700">
          <span className="text-green-500">●</span>
          ~94% global coverage
        </span>
      </div>
    </div>
  )
}

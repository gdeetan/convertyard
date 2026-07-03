const FILES = [
  'IMG_0421.HEIC',
  'IMG_0422.HEIC',
  'IMG_0423.HEIC',
  'IMG_0424.HEIC',
]

const CONTEXT_MENU = [
  { label: 'Open with', arrow: true, highlight: false },
  { label: 'Convert to JPG', arrow: false, highlight: true },
  { label: 'Properties', arrow: false, highlight: false },
]

export function HeicToJpgWindowsIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Windows-style title bar */}
      <div className="flex items-center justify-between border-b border-[#dadce0] bg-[#0078d4] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-white font-semibold">File Explorer</span>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-[11px] text-white/80">—</span>
          <span className="font-mono text-[11px] text-white/80">□</span>
          <span className="font-mono text-[11px] text-white/80">✕</span>
        </div>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5">
        <span className="font-mono text-[10px] text-[#5f6368]">←</span>
        <span className="font-mono text-[10px] text-[#5f6368]">→</span>
        <span className="font-mono text-[10px] text-[#5f6368]">↑</span>
        <div className="flex-1 rounded border border-[#dadce0] bg-white px-2 py-0.5 font-mono text-[10px] text-[#1a73e8]">
          This PC › Pictures › Vacation
        </div>
      </div>

      {/* File grid + context menu */}
      <div className="relative p-3 bg-white min-h-[140px]">
        <div className="grid grid-cols-4 gap-2">
          {FILES.map((filename, i) => (
            <div
              key={filename}
              className={`flex flex-col items-center gap-1 rounded p-1.5 cursor-default select-none ${
                i === 1 ? 'bg-[#cce4ff] border border-[#0078d4]' : 'hover:bg-[#f0f0f0]'
              }`}
            >
              {/* File icon with no-entry badge */}
              <div className="relative">
                {/* Generic file icon */}
                <div
                  className="w-9 h-11 bg-[#e5e7eb] rounded-sm border border-[#d1d5db] flex items-end justify-center pb-1 relative"
                >
                  {/* Dog-ear */}
                  <div
                    className="absolute top-0 right-0 w-2.5 h-2.5 bg-white border-b border-l border-[#d1d5db]"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
                  />
                  <span className="font-mono text-[8px] text-[#6b7280] font-bold">HEIC</span>
                </div>
                {/* ⊘ badge */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white">
                  <span className="text-white font-bold" style={{ fontSize: '8px' }}>⊘</span>
                </div>
              </div>
              <span className="font-mono text-[9px] text-fg text-center leading-tight">{filename}</span>
            </div>
          ))}
        </div>

        {/* Right-click context menu — over file 2 */}
        <div
          className="absolute z-10 rounded-md border border-[#d1d5db] bg-white shadow-lg py-0.5"
          style={{ top: 48, left: '26%', minWidth: 140 }}
        >
          {CONTEXT_MENU.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center justify-between px-3 py-1.5 font-sans text-xs cursor-default ${
                item.highlight
                  ? 'bg-[#0078d4] text-white'
                  : 'text-fg hover:bg-[#f0f0f0]'
              } ${i < CONTEXT_MENU.length - 1 && !item.highlight && i !== 0 ? '' : ''}`}
            >
              <span className={item.highlight ? 'font-semibold' : ''}>{item.label}</span>
              {item.arrow && <span className="text-[10px] opacity-60">▶</span>}
            </div>
          ))}
          <div className="border-t border-[#e5e7eb] my-0.5" />
          <div className="px-3 py-1.5 font-sans text-xs text-fg hover:bg-[#f0f0f0] cursor-default">
            Properties
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1 text-[10px] text-[#5f6368] font-mono flex items-center justify-between">
        <span>4 items · HEIC files cannot open without Apple codecs</span>
        <span className="text-[#0078d4]">⊘ No codec</span>
      </div>
    </div>
  )
}

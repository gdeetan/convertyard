const rows = [
  {
    icon: '📍',
    key: 'GPS Location',
    value: '37.7749° N, 122.4194° W (San Francisco, CA)',
    sensitive: true,
  },
  {
    icon: '📷',
    key: 'Camera',
    value: 'iPhone 15 Pro · f/1.78 · 1/120s',
    sensitive: false,
  },
  {
    icon: '🕐',
    key: 'Taken',
    value: 'March 14, 2024 · 2:31 PM',
    sensitive: false,
  },
  {
    icon: '📦',
    key: 'File size',
    value: '4.2 MB',
    sensitive: false,
  },
]

export function ExifDataIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* macOS-style title bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2 mx-auto">photo_2024.jpg — Info</span>
      </div>

      {/* Info panel */}
      <div className="divide-y divide-border bg-bg p-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`flex items-start gap-3 px-3 py-2.5 ${row.sensitive ? 'bg-red-50' : 'bg-white'}`}
          >
            <span className="text-sm mt-px">{row.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] text-fg-subtle uppercase tracking-wide">{row.key}</p>
              <p className={`font-mono text-[11px] mt-0.5 ${row.sensitive ? 'text-red-700 font-semibold' : 'text-fg'}`}>
                {row.value}
              </p>
            </div>
            {row.sensitive && (
              <span className="shrink-0 rounded bg-red-100 border border-red-200 px-1.5 py-0.5 font-mono text-[9px] text-red-600 font-semibold">
                SENSITIVE
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5">
        <p className="font-mono text-[10px] text-[#5f6368]">EXIF data embedded in file · visible to anyone · strip before sharing</p>
      </div>
    </div>
  )
}

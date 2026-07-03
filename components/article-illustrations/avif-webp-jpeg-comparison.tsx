const formats = [
  { name: 'JPEG', size: '4.2 MB', widthPct: '100%', barColor: 'bg-orange-400' },
  { name: 'WebP', size: '2.1 MB', widthPct: '50%',  barColor: 'bg-blue-400' },
  { name: 'AVIF', size: '1.4 MB', widthPct: '33%',  barColor: 'bg-green-500' },
]

export function AvifWebpJpegIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center border-b border-[#dadce0] bg-[#f1f3f4] px-4 py-2">
        <span className="font-mono text-[11px] text-[#5f6368]">File Size Comparison</span>
      </div>

      <div className="px-6 py-5">
        <p className="font-sans text-xs text-fg-muted mb-5 text-center tracking-wide">
          same image · same visual quality
        </p>

        <div className="space-y-4">
          {formats.map((fmt) => (
            <div key={fmt.name} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-fg w-10 shrink-0">{fmt.name}</span>
              <div className="flex-1 relative h-6 bg-bg-muted rounded overflow-hidden">
                <div
                  className={`h-full ${fmt.barColor} rounded`}
                  style={{ width: fmt.widthPct }}
                />
              </div>
              <span className="font-mono text-[11px] text-fg-muted w-14 text-right shrink-0">
                {fmt.size}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="font-sans text-[11px] text-fg-muted">AVIF saves 67% vs JPEG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-400" />
            <span className="font-sans text-[11px] text-fg-muted">WebP saves 50% vs JPEG</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const codecs = [
  { name: 'H.264', size: '48 MB', widthPct: '100%', barColor: 'bg-orange-400', note: 'plays everywhere' },
  { name: 'H.265', size: '28 MB', widthPct: '58%', barColor: 'bg-green-500', note: 'same clip, same quality' },
]

export function H264VsH265Illustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center border-b border-[#dadce0] bg-[#f1f3f4] px-4 py-2">
        <span className="font-mono text-[11px] text-[#5f6368]">
          3-min 1080p talking-head · same CRF-equivalent quality
        </span>
      </div>

      <div className="px-6 py-5">
        <div className="space-y-4">
          {codecs.map((c) => (
            <div key={c.name}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-fg w-12 shrink-0">{c.name}</span>
                <div className="flex-1 relative h-6 bg-bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full ${c.barColor} rounded`}
                    style={{ width: c.widthPct }}
                  />
                </div>
                <span className="font-mono text-[11px] text-fg-muted w-12 text-right shrink-0">
                  {c.size}
                </span>
              </div>
              <p className="mt-1 ml-[60px] font-sans text-[10px] text-fg-subtle">{c.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
          <span className="font-sans text-[11px] text-fg-muted">
            H.265 is ~40% smaller here
          </span>
          <span className="hidden sm:inline font-sans text-[11px] text-fg-subtle">·</span>
          <span className="font-sans text-[11px] text-fg-muted">
            Send H.264 if you do not know the player
          </span>
        </div>
      </div>
    </div>
  )
}

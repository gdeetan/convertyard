const rows = [
  { rate: '64 kbps', use: 'Speech / podcasts', size: '1.4 MB', width: '20%', tone: 'muted' },
  { rate: '128 kbps', use: 'Email, messaging', size: '2.8 MB', width: '40%', tone: 'muted' },
  { rate: '192 kbps', use: 'Music — start here', size: '4.2 MB', width: '60%', tone: 'primary' },
  { rate: '320 kbps', use: 'Streaming uploads', size: '6.9 MB', width: '100%', tone: 'muted' },
]

export function AudioBitrateIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">
          Bitrate vs file size — 3-minute song
        </span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {rows.map((row) => (
          <div key={row.rate}>
            <div className="flex items-center justify-between mb-1">
              <span
                className={`font-mono text-[11px] ${
                  row.tone === 'primary' ? 'font-semibold text-fg' : 'text-fg'
                }`}
              >
                {row.rate}
              </span>
              <span className="font-mono text-[10px] text-fg-subtle">{row.size}</span>
            </div>
            <div className="h-5 rounded bg-bg-muted overflow-hidden">
              <div
                className={`h-full rounded ${
                  row.tone === 'primary' ? 'bg-primary' : 'bg-orange-300'
                }`}
                style={{ width: row.width }}
              />
            </div>
            <p className="mt-0.5 font-sans text-[10px] text-fg-subtle">{row.use}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 text-center">
        <span className="font-mono text-[10px] text-[#5f6368]">
          192 kbps VBR is enough for most listening
        </span>
      </div>
    </div>
  )
}

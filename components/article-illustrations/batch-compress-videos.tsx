const FILES = [
  { name: 'lecture-01.mp4', status: 'done', progress: 100, before: '142 MB', after: '24 MB' },
  { name: 'lecture-02.mov', status: 'done', progress: 100, before: '198 MB', after: '25 MB' },
  { name: 'lecture-03.mp4', status: 'converting', progress: 58, before: null, after: null },
  { name: 'lecture-04.mkv', status: 'waiting', progress: 0, before: null, after: null },
  { name: 'q-and-a.webm', status: 'waiting', progress: 0, before: null, after: null },
]

export function BatchCompressVideosIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <span className="font-mono text-[11px] text-[#5f6368]">
          Compressing <span className="font-semibold text-fg">8 videos</span> → 25 MB MP4
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
          3 of 8
        </span>
      </div>

      <div className="divide-y divide-border bg-white">
        {FILES.map((file) => (
          <div key={file.name} className="flex items-center gap-3 px-3 py-2">
            <span className="font-mono text-[11px] text-fg w-[118px] truncate shrink-0">
              {file.name}
            </span>

            <div className="flex-1 h-2 rounded-full bg-bg-muted border border-border overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  file.status === 'done'
                    ? 'bg-green-500'
                    : file.status === 'converting'
                      ? 'bg-green-400'
                      : 'bg-transparent'
                }`}
                style={{ width: `${file.progress}%` }}
              />
            </div>

            <div className="w-[128px] shrink-0 flex items-center gap-1">
              {file.status === 'done' && (
                <>
                  <span className="text-green-600 text-[11px]">✓</span>
                  <span className="font-mono text-[10px] text-fg-subtle">
                    {file.before} → {file.after}
                  </span>
                </>
              )}
              {file.status === 'converting' && (
                <span className="font-mono text-[10px] text-primary">58% · encoding</span>
              )}
              {file.status === 'waiting' && (
                <span className="font-mono text-[10px] text-fg-subtle">Queued</span>
              )}
            </div>
          </div>
        ))}

        <div className="px-3 py-1.5">
          <span className="font-mono text-[10px] text-fg-subtle italic">… 3 more files</span>
        </div>
      </div>

      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 flex items-center gap-1 flex-wrap">
        <span className="font-mono text-[10px] text-green-700">2 done</span>
        <span className="font-mono text-[10px] text-fg-subtle">·</span>
        <span className="font-mono text-[10px] text-primary">1 encoding</span>
        <span className="font-mono text-[10px] text-fg-subtle">·</span>
        <span className="font-mono text-[10px] text-fg-subtle">5 queued</span>
        <span className="font-mono text-[10px] text-fg-subtle">·</span>
        <span className="font-mono text-[10px] text-fg-muted">ZIP when the last file finishes</span>
      </div>
    </div>
  )
}

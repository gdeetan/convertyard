const FILES = [
  { name: 'vacation-01.jpg', status: 'done',       progress: 100, before: '1.2 MB', after: '340 KB' },
  { name: 'vacation-02.jpg', status: 'done',       progress: 100, before: '980 KB', after: '290 KB' },
  { name: 'vacation-03.jpg', status: 'converting', progress: 62,  before: null,     after: null },
  { name: 'vacation-04.jpg', status: 'waiting',    progress: 0,   before: null,     after: null },
  { name: 'vacation-05.jpg', status: 'waiting',    progress: 0,   before: null,     after: null },
]

export function BatchConvertIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <span className="font-mono text-[11px] text-[#5f6368]">
          Converting <span className="font-semibold text-fg">12 files</span> → WebP
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
          In progress
        </span>
      </div>

      {/* File list */}
      <div className="divide-y divide-border bg-white">
        {FILES.map((file) => (
          <div key={file.name} className="flex items-center gap-3 px-3 py-2">
            {/* Filename */}
            <span className="font-mono text-[11px] text-fg w-[120px] truncate shrink-0">{file.name}</span>

            {/* Progress bar */}
            <div className="flex-1 h-2 rounded-full bg-bg-muted border border-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  file.status === 'done' ? 'bg-green-500' :
                  file.status === 'converting' ? 'bg-green-400' :
                  'bg-transparent'
                }`}
                style={{ width: `${file.progress}%` }}
              />
            </div>

            {/* Status / sizes */}
            <div className="w-[120px] shrink-0 flex items-center gap-1">
              {file.status === 'done' && (
                <>
                  <span className="text-green-600 text-[11px]">✓</span>
                  <span className="font-mono text-[10px] text-fg-subtle">
                    {file.before} → {file.after}
                  </span>
                </>
              )}
              {file.status === 'converting' && (
                <span className="font-mono text-[10px] text-primary">{file.progress}% · converting...</span>
              )}
              {file.status === 'waiting' && (
                <span className="font-mono text-[10px] text-fg-subtle">Waiting</span>
              )}
            </div>
          </div>
        ))}

        {/* More indicator */}
        <div className="px-3 py-1.5">
          <span className="font-mono text-[10px] text-fg-subtle italic">... 7 more files</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 flex items-center gap-1 flex-wrap">
        <span className="font-mono text-[10px] text-green-700">2 done</span>
        <span className="font-mono text-[10px] text-fg-subtle">·</span>
        <span className="font-mono text-[10px] text-primary">1 converting</span>
        <span className="font-mono text-[10px] text-fg-subtle">·</span>
        <span className="font-mono text-[10px] text-fg-subtle">9 waiting</span>
        <span className="font-mono text-[10px] text-fg-subtle">·</span>
        <span className="font-mono text-[10px] text-fg-muted">ZIP ready when complete</span>
      </div>
    </div>
  )
}

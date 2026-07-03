export function BrowserConversionIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Browser chrome */}
      <div className="border-b border-[#dadce0] bg-[#f1f3f4]">
        {/* Tab bar */}
        <div className="flex items-center px-3 pt-2 gap-1">
          <div className="flex items-center gap-1.5 bg-white rounded-t px-3 py-1.5 border border-b-0 border-[#dadce0]">
            <div className="w-3 h-3 rounded-full bg-[#dadce0]" />
            <span className="font-sans text-[11px] text-[#3c4043]">ConvertYard — PDF Compressor</span>
            <span className="font-sans text-[11px] text-[#5f6368] ml-1">✕</span>
          </div>
        </div>
        {/* Address bar row */}
        <div className="flex items-center gap-2 px-3 pb-2 pt-1">
          <div className="flex gap-1">
            <span className="font-sans text-[12px] text-[#5f6368] cursor-pointer">←</span>
            <span className="font-sans text-[12px] text-[#5f6368] cursor-pointer">→</span>
            <span className="font-sans text-[12px] text-[#5f6368] cursor-pointer">↻</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-white rounded-full border border-[#dadce0] px-3 py-1">
            <span className="text-[11px] text-green-600">🔒</span>
            <span className="font-mono text-[11px] text-[#3c4043]">convertyard.com/compress-pdf</span>
          </div>
          <span className="font-sans text-[14px] text-[#5f6368]">⋮</span>
        </div>
      </div>

      {/* Page content */}
      <div className="bg-bg-elevated px-6 py-6">
        <div className="flex items-stretch gap-4">
          {/* Your device */}
          <div className="flex-1 rounded-lg border border-border bg-white p-4 flex flex-col items-center gap-2">
            <div className="text-2xl">⬡</div>
            <span className="font-sans text-xs font-medium text-fg">Your device</span>
            <div className="mt-1 rounded bg-bg-muted px-2 py-1 text-center">
              <span className="font-mono text-[10px] text-fg-muted">libvips.wasm running</span>
            </div>
            <div className="mt-1 rounded bg-bg-muted px-2 py-1 text-center">
              <span className="font-mono text-[10px] text-fg-muted">pdf-lib.js active</span>
            </div>
          </div>

          {/* Arrow + label */}
          <div className="flex flex-col items-center justify-center gap-1 shrink-0">
            <div className="relative flex items-center gap-0.5">
              <div className="w-12 h-0.5 bg-border" />
              <span className="font-sans text-[10px] text-border">▶</span>
            </div>
            <div className="relative -mt-1">
              <span
                className="font-sans text-[18px] text-red-500 font-bold absolute left-1/2 top-1/2"
                style={{ transform: 'translate(-50%, -50%) rotate(-10deg)' }}
              >
                ✕
              </span>
            </div>
            <span className="font-sans text-[9px] text-fg-subtle mt-3">blocked</span>
          </div>

          {/* Internet */}
          <div className="flex-1 rounded-lg border border-border bg-white p-4 flex flex-col items-center gap-2">
            <div className="relative">
              <span className="text-2xl">☁</span>
              <span
                className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-lg"
                style={{ textShadow: '0 0 0 red' }}
              >
                ✕
              </span>
            </div>
            <span className="font-sans text-xs font-medium text-fg">Internet</span>
            <div className="mt-1 rounded bg-bg-muted px-2 py-1 text-center">
              <span className="font-mono text-[10px] text-fg-muted">0 requests</span>
            </div>
            <div className="mt-1 rounded bg-red-50 border border-red-100 px-2 py-1 text-center">
              <span className="font-mono text-[10px] text-red-500">no uploads</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center font-sans text-[11px] text-fg-subtle">
          Files are processed entirely on your device. Nothing is sent to any server.
        </p>
      </div>
    </div>
  )
}

// Pixel grid colors for the illustration
const GRID_COLORS = [
  ['#ef4444', '#f97316', '#eab308', '#22c55e'],
  ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'],
  ['#f97316', '#22c55e', '#3b82f6', '#ef4444'],
  ['#eab308', '#ec4899', '#8b5cf6', '#f97316'],
]

export function LosslessVsLossyIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Lossless vs Lossy — Pixel Comparison</span>
      </div>

      {/* Two panels */}
      <div className="flex gap-3 p-4 bg-bg">

        {/* Left: Lossless */}
        <div className="flex-1">
          <div className="rounded-lg border border-border overflow-hidden shadow-sm bg-white">
            {/* Label bar */}
            <div className="bg-blue-50 border-b border-blue-100 px-2.5 py-1.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-blue-700">Lossless (PNG)</span>
              <span className="font-mono text-[10px] text-blue-500">PNG: 1.4 MB</span>
            </div>
            {/* Crisp pixel grid */}
            <div className="p-2">
              <div
                className="w-full rounded overflow-hidden"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}
              >
                {GRID_COLORS.flatMap((row, ri) =>
                  row.map((color, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      style={{ backgroundColor: color, height: 22 }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-fg-muted text-center">Every pixel preserved</p>
        </div>

        {/* Right: Lossy */}
        <div className="flex-1">
          <div className="rounded-lg border border-border overflow-hidden shadow-sm bg-white">
            {/* Label bar */}
            <div className="bg-orange-50 border-b border-orange-100 px-2.5 py-1.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-orange-700">Lossy (JPG Q=30)</span>
              <span className="font-mono text-[10px] text-orange-500">JPG: 89 KB</span>
            </div>
            {/* Blurry/artifact pixel grid — simulated with larger blocks and blur overlay */}
            <div className="p-2">
              <div className="w-full rounded overflow-hidden relative">
                {/* Base grid — 2x2 blocks instead of 4x4 to simulate blockiness */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}
                >
                  {[
                    ['#e86060', '#d4a040'],
                    ['#5a90d0', '#9070b8'],
                  ].flatMap((row, ri) =>
                    row.map((color, ci) => (
                      <div
                        key={`${ri}-${ci}`}
                        style={{ backgroundColor: color, height: 44 }}
                      />
                    ))
                  )}
                </div>
                {/* Blur/artifact overlay */}
                <div
                  className="absolute inset-0 rounded"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.08) 50%, rgba(255,255,255,0.1) 100%)',
                    backdropFilter: 'blur(1px)',
                  }}
                />
              </div>
            </div>
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-fg-muted text-center">Artifacts visible</p>
        </div>

      </div>

      {/* Size comparison strip */}
      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 flex items-center justify-center gap-6">
        <span className="font-mono text-[10px] text-blue-700">PNG: 1.4 MB (lossless)</span>
        <span className="font-mono text-[10px] text-[#9ca3af]">vs</span>
        <span className="font-mono text-[10px] text-orange-700">JPG: 89 KB (94% smaller)</span>
      </div>
    </div>
  )
}

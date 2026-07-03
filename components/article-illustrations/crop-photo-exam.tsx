export function CropPhotoExamIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Crop Tool — Exam Photo</span>
      </div>

      {/* Crop interface */}
      <div className="p-4 bg-[#1a1a1a] flex gap-3 items-start">

        {/* Left ruler */}
        <div className="flex flex-col items-center gap-0 pt-6">
          <div className="w-2 flex flex-col" style={{ height: 120 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center justify-end flex-1">
                <div className={`bg-[#9ca3af] ${i % 3 === 0 ? 'w-2' : 'w-1'}`} style={{ height: 1 }} />
              </div>
            ))}
          </div>
          <span className="font-mono text-[9px] text-[#6b7280] mt-1 -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center' }}>4.5 cm</span>
        </div>

        {/* Crop frame container */}
        <div className="flex-1 flex flex-col items-center gap-2">

          {/* Dimension label above */}
          <div className="bg-[#c2410c] text-white rounded px-2 py-0.5 font-mono text-[10px] font-semibold">
            3.5 × 4.5 cm
          </div>

          {/* Photo with crop overlay */}
          <div className="relative" style={{ width: 90, height: 120 }}>
            {/* Dimmed outer area */}
            <div className="absolute inset-0 rounded bg-[#4b5563] opacity-40" />

            {/* Main photo area (full brightness inside crop) */}
            <div className="absolute inset-0 flex items-center justify-center rounded overflow-hidden">
              {/* Person silhouette */}
              <div className="bg-[#6b7280] w-full h-full flex flex-col items-center justify-end pb-0">
                <div className="w-12 h-12 rounded-full bg-[#9ca3af] mb-0" style={{ marginBottom: -2 }} />
                <div className="w-16 h-10 rounded-t-full bg-[#9ca3af]" />
              </div>
            </div>

            {/* Dashed crop border */}
            <div
              className="absolute border-2 border-dashed border-white rounded"
              style={{ inset: 6 }}
            />

            {/* Corner handles */}
            {[
              { top: 4, left: 4 },
              { top: 4, right: 4 },
              { bottom: 4, left: 4 },
              { bottom: 4, right: 4 },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-white rounded-sm shadow"
                style={pos}
              />
            ))}
          </div>

          {/* Aspect ratio pills */}
          <div className="flex gap-2 mt-1">
            <span className="rounded-full bg-[#c2410c] px-2.5 py-0.5 font-sans text-[10px] font-semibold text-white">
              Aspect ratio: 3:4
            </span>
            <span className="rounded-full border border-[#4b5563] bg-transparent px-2.5 py-0.5 font-sans text-[10px] font-semibold text-[#9ca3af]">
              Freeform
            </span>
          </div>

        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#5f6368]">Crop to exam dimensions before upload</span>
        <span className="font-mono text-[10px] text-[#c2410c] font-semibold">Preview →</span>
      </div>
    </div>
  )
}

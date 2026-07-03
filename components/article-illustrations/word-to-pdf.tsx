export function WordToPdfIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Word → PDF Conversion</span>
      </div>

      {/* Content */}
      <div className="flex items-stretch gap-0 bg-bg p-4">

        {/* Left: DOCX panel */}
        <div className="flex-1 rounded-lg border border-border bg-white overflow-hidden shadow-sm">
          <div className="bg-[#2b579a] px-3 py-1.5 flex items-center justify-between">
            <span className="font-mono text-[11px] text-white font-semibold">.docx</span>
            <span className="font-mono text-[10px] text-blue-200">Microsoft Word</span>
          </div>
          <div className="p-3 space-y-2">
            {/* Fake text lines */}
            <div className="h-2 rounded bg-[#d1d5db] w-full" />
            <div className="h-2 rounded bg-[#d1d5db] w-4/5" />
            <div className="h-2 rounded bg-[#d1d5db] w-full" />
            <div className="h-2 rounded bg-[#d1d5db] w-3/5" />
            {/* Fake table */}
            <div className="mt-3 grid grid-cols-2 border border-[#d1d5db] rounded overflow-hidden">
              <div className="border-r border-b border-[#d1d5db] p-1.5 bg-[#f3f4f6]">
                <div className="h-1.5 rounded bg-[#9ca3af] w-full" />
              </div>
              <div className="border-b border-[#d1d5db] p-1.5 bg-[#f3f4f6]">
                <div className="h-1.5 rounded bg-[#9ca3af] w-3/4" />
              </div>
              <div className="border-r border-[#d1d5db] p-1.5">
                <div className="h-1.5 rounded bg-[#d1d5db] w-full" />
              </div>
              <div className="p-1.5">
                <div className="h-1.5 rounded bg-[#d1d5db] w-4/5" />
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center px-3 gap-1">
          <span className="font-mono text-[10px] text-fg-muted whitespace-nowrap">converts</span>
          <span className="text-fg-subtle text-lg leading-none">→</span>
        </div>

        {/* Right: PDF panel */}
        <div className="flex-1 rounded-lg border border-border bg-white overflow-hidden shadow-sm">
          <div className="bg-[#c2410c] px-3 py-1.5 flex items-center justify-between">
            <span className="font-mono text-[11px] text-white font-semibold">.pdf</span>
            <span className="font-mono text-[10px] text-orange-200">PDF Document</span>
          </div>
          <div className="p-3 space-y-2">
            {/* Same fake text lines */}
            <div className="h-2 rounded bg-[#d1d5db] w-full" />
            <div className="h-2 rounded bg-[#d1d5db] w-4/5" />
            <div className="h-2 rounded bg-[#d1d5db] w-full" />
            <div className="h-2 rounded bg-[#d1d5db] w-3/5" />
            {/* Same fake table */}
            <div className="mt-3 grid grid-cols-2 border border-[#d1d5db] rounded overflow-hidden">
              <div className="border-r border-b border-[#d1d5db] p-1.5 bg-[#f3f4f6]">
                <div className="h-1.5 rounded bg-[#9ca3af] w-full" />
              </div>
              <div className="border-b border-[#d1d5db] p-1.5 bg-[#f3f4f6]">
                <div className="h-1.5 rounded bg-[#9ca3af] w-3/4" />
              </div>
              <div className="border-r border-[#d1d5db] p-1.5">
                <div className="h-1.5 rounded bg-[#d1d5db] w-full" />
              </div>
              <div className="p-1.5">
                <div className="h-1.5 rounded bg-[#d1d5db] w-4/5" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Tags */}
      <div className="flex gap-2 px-4 pb-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 font-sans text-xs text-green-700">
          ✓ Text preserved
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 font-sans text-xs text-green-700">
          ✓ Tables preserved
        </span>
      </div>
    </div>
  )
}

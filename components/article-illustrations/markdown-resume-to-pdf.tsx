export function MarkdownResumeToPdfIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">
          resume.md → Resume.pdf
        </span>
      </div>

      {/* Content */}
      <div className="flex items-stretch gap-0 bg-bg p-4">

        {/* Left: Markdown source */}
        <div className="flex-1 rounded-lg border border-border bg-[#1e293b] overflow-hidden shadow-sm">
          <div className="bg-[#0f172a] px-3 py-1.5 flex items-center justify-between">
            <span className="font-mono text-[11px] text-white font-semibold">resume.md</span>
            <span className="font-mono text-[10px] text-slate-400">Markdown</span>
          </div>
          <div className="p-3 space-y-1.5 font-mono text-[10px] leading-tight">
            <div className="text-[#f472b6]"># Jamie Rivera</div>
            <div className="text-slate-300">Senior Software Engineer</div>
            <div className="text-slate-500">jamie@example.com</div>
            <div className="h-1" />
            <div className="text-[#f472b6]">## Experience</div>
            <div className="text-[#38bdf8]">### Staff Engineer — Rippling</div>
            <div className="text-slate-400">**2023 — Present**</div>
            <div className="text-slate-300">- Rebuilt pipeline in Go</div>
            <div className="text-slate-300">- Cut P99 latency 60%</div>
            <div className="text-slate-300">- Led platform hiring</div>
            <div className="h-1" />
            <div className="text-[#f472b6]">## Skills</div>
            <div className="text-slate-300">Go, Python, SQL, Kubernetes</div>
          </div>
        </div>

        {/* Arrow with ConvertYard */}
        <div className="flex flex-col items-center justify-center px-3 gap-1">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-sans text-[9px] font-semibold text-primary whitespace-nowrap">
            ConvertYard
          </span>
          <span className="text-fg-subtle text-lg leading-none">→</span>
          <span className="font-mono text-[9px] text-fg-muted whitespace-nowrap">
            in-browser
          </span>
        </div>

        {/* Right: Rendered PDF resume */}
        <div className="flex-1 rounded-lg border border-border bg-white overflow-hidden shadow-sm">
          <div className="bg-[#c2410c] px-3 py-1.5 flex items-center justify-between">
            <span className="font-mono text-[11px] text-white font-semibold">Resume.pdf</span>
            <span className="font-mono text-[10px] text-orange-200">ATS-friendly</span>
          </div>
          <div className="p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-900">Jamie Rivera</div>
            <div className="text-[9px] text-slate-600">Senior Software Engineer</div>
            <div className="text-[8px] text-slate-500">jamie@example.com</div>
            <div className="h-px bg-slate-200" />
            <div className="text-[9px] font-semibold text-slate-800 uppercase tracking-wider">
              Experience
            </div>
            <div className="text-[9px] font-semibold text-slate-700">
              Staff Engineer — Rippling
            </div>
            <div className="text-[8px] text-slate-500 italic">2023 — Present</div>
            <div className="space-y-0.5 pl-2">
              <div className="h-1 rounded bg-slate-300 w-full" />
              <div className="h-1 rounded bg-slate-300 w-5/6" />
              <div className="h-1 rounded bg-slate-300 w-3/4" />
            </div>
            <div className="h-px bg-slate-200" />
            <div className="text-[9px] font-semibold text-slate-800 uppercase tracking-wider">
              Skills
            </div>
            <div className="h-1 rounded bg-slate-300 w-4/5" />
          </div>
        </div>

      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 font-sans text-xs text-green-700">
          ✓ Version-controlled
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 font-sans text-xs text-green-700">
          ✓ No watermark
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 font-sans text-xs text-green-700">
          ✓ Local-only
        </span>
      </div>
    </div>
  )
}

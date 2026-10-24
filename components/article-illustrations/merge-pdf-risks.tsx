export function MergePdfRisksIllustration() {
  return (
    <figure className="my-8">
      <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Upload / server panel */}
          <div className="md:col-span-2 relative bg-[#eef2f7] p-5 border-b md:border-b-0 md:border-r border-border">
            <svg viewBox="0 0 220 260" className="w-full h-auto" aria-hidden="true">
              {/* PDF document */}
              <g transform="translate(28,20)">
                <rect x="0" y="0" width="80" height="100" rx="4" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
                <rect x="0" y="0" width="80" height="14" fill="#dc2626" />
                <text x="40" y="10" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#ffffff" fontWeight="700">
                  contract.pdf
                </text>
                <path d="M10 28 L70 28 M10 36 L70 36 M10 44 L55 44 M10 56 L70 56 M10 64 L70 64 M10 72 L45 72 M10 84 L60 84 M10 92 L50 92" stroke="#9ca3af" strokeWidth="1.2" />
              </g>

              {/* Upload arrow */}
              <g transform="translate(100,130)">
                <path d="M10 0 L10 30 M0 10 L10 0 L20 10" stroke="#dc2626" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text x="30" y="20" fontFamily="ui-monospace, monospace" fontSize="9" fill="#991b1b" fontWeight="700">UPLOAD</text>
              </g>

              {/* Server / cloud */}
              <g transform="translate(40,170)">
                <rect x="0" y="10" width="140" height="70" rx="6" fill="#1f2937" />
                <rect x="10" y="22" width="120" height="10" rx="2" fill="#374151" />
                <circle cx="18" cy="27" r="2" fill="#10b981" />
                <rect x="10" y="38" width="120" height="10" rx="2" fill="#374151" />
                <circle cx="18" cy="43" r="2" fill="#f59e0b" />
                <rect x="10" y="54" width="120" height="10" rx="2" fill="#374151" />
                <circle cx="18" cy="59" r="2" fill="#ef4444" />
                <text x="70" y="76" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#9ca3af">
                  unknown-server.com
                </text>
              </g>
            </svg>
            <div className="absolute left-3 bottom-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
              Your file leaves your device
            </div>
          </div>

          {/* Risks panel */}
          <div className="md:col-span-3 bg-white divide-y divide-border">
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold">1</span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-red-700 font-semibold">Server retention</p>
                <p className="text-[12px] text-fg mt-0.5">File stored for hours — sometimes archived indefinitely.</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold">2</span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-red-700 font-semibold">OCR indexing</p>
                <p className="text-[12px] text-fg mt-0.5">Names, addresses, account numbers extracted as searchable text.</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold">3</span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-red-700 font-semibold">Metadata extraction</p>
                <p className="text-[12px] text-fg mt-0.5">Author, company, "Confidential" flag — pulled out and stored.</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-start gap-3 bg-red-50">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-800 font-mono text-[10px] font-bold">4</span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-red-800 font-semibold">GDPR &amp; jurisdiction</p>
                <p className="text-[12px] text-red-900 mt-0.5 font-semibold">Hosted abroad under weaker data-protection laws.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-bg px-4 py-2">
          <p className="font-mono text-[10px] text-fg-subtle">
            Four things that happen the moment your PDF hits a third-party server.
          </p>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-fg-subtle">
        What a typical free online PDF tool does with a document the second you upload it.
      </figcaption>
    </figure>
  )
}

export function PasswordProtectIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center border-b border-[#dadce0] bg-[#f1f3f4] px-4 py-2">
        <span className="font-mono text-[11px] text-[#5f6368]">Password Protect PDF</span>
      </div>

      {/* Muted background with centered modal */}
      <div className="bg-bg-muted px-6 py-6 flex flex-col items-center gap-3">
        {/* Modal dialog */}
        <div className="w-64 rounded-lg border border-border bg-white shadow-md overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-bg-elevated">
            <span className="text-base">🔒</span>
            <span className="font-sans text-sm font-semibold text-fg">Protect PDF</span>
          </div>

          {/* Modal body */}
          <div className="px-4 py-4 space-y-3">
            {/* Password field */}
            <div className="space-y-1">
              <label className="font-sans text-[11px] text-fg-muted">Password</label>
              <div className="w-full rounded border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-fg-subtle tracking-widest">
                ••••••••••
              </div>
            </div>

            {/* Encryption label */}
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] text-fg-muted">Encryption</span>
              <span className="font-mono text-[11px] text-fg font-medium">AES-256</span>
            </div>

            {/* Protect button */}
            <button className="w-full rounded bg-green-600 px-4 py-2 font-sans text-xs font-semibold text-white">
              Protect
            </button>
          </div>
        </div>

        {/* Badge below modal */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 shadow-sm">
          <span className="font-sans text-[11px] text-fg-muted">2 files · ready to encrypt</span>
        </div>
      </div>
    </div>
  )
}

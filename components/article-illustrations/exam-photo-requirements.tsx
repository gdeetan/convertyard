const rows = [
  { exam: 'UPSC',    size: '20–300 KB', dims: '3.5×4.5 cm',  highlight: true },
  { exam: 'SSC CGL', size: '20–50 KB',  dims: '100×120 px',  highlight: false },
  { exam: 'NEET',    size: '10–200 KB', dims: '3.5×4.5 cm',  highlight: false },
  { exam: 'JEE Main',size: '10–200 KB', dims: '3.5×4.5 cm',  highlight: false },
  { exam: 'IBPS PO', size: '20–50 KB',  dims: '200×230 px',  highlight: false },
]

export function ExamPhotoRequirementsIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Portal header bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">NTA Candidate Portal</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-mono text-[10px] text-[#5f6368]">Secure</span>
        </div>
      </div>

      {/* Table */}
      <div className="p-3">
        <p className="font-sans text-xs font-semibold text-fg mb-2">Photo Upload Requirements — All Exams</p>
        <table className="w-full border-collapse font-mono text-[11px]">
          {/* Header */}
          <thead>
            <tr className="bg-bg-muted">
              <th className="border border-border px-2.5 py-1.5 text-left font-semibold text-fg">Exam</th>
              <th className="border border-border px-2.5 py-1.5 text-left font-semibold text-fg">Photo size</th>
              <th className="border border-border px-2.5 py-1.5 text-left font-semibold text-fg">Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.exam}
                className={
                  row.highlight
                    ? 'bg-orange-50'
                    : i % 2 === 0
                    ? 'bg-white'
                    : 'bg-bg-elevated'
                }
              >
                <td className={`border border-border px-2.5 py-1.5 font-semibold ${row.highlight ? 'text-text-primary text-[#c2410c]' : 'text-fg'}`}>
                  {row.exam}
                </td>
                <td className="border border-border px-2.5 py-1.5 text-fg-muted">{row.size}</td>
                <td className="border border-border px-2.5 py-1.5 text-fg-muted">{row.dims}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1.5 font-mono text-[10px] text-fg-subtle">* UPSC row highlighted — most searched exam</p>
      </div>
    </div>
  )
}
